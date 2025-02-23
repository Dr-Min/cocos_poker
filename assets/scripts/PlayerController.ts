import {
  _decorator,
  Component,
  Node,
  Vec3,
  input,
  Input,
  EventKeyboard,
  KeyCode,
  RigidBody2D,
  Collider2D,
  Animation,
  UITransform,
  director,
} from "cc";
import { GameManager } from "./GameManager";
import { GameState } from "./GameState";
const { ccclass, property } = _decorator;

@ccclass("PlayerController")
export class PlayerController extends Component {
  private static readonly PLAYER_TAG: number = 0;

  @property
  public speed: number = 1.6;

  @property
  public dashSpeed: number = 4;

  @property
  public maxHp: number = 10;

  // 대시 관련 속성
  @property
  private dashDuration: number = 200; // ms

  @property
  private dashCooldown: number = 500; // ms

  @property
  private maxDashCharges: number = 3;

  private _hp: number = 10;
  private _isDashing: boolean = false;
  private _canDash: boolean = true;
  private _dashCharges: number = 3;
  private _lastDashTime: number = 0;
  private _moveDirection: Vec3 = new Vec3();
  private _rigidbody: RigidBody2D = null;
  private _anim: Animation = null;
  private _isMoving: boolean = false;
  private _facingLeft: boolean = false;

  // 키 입력 상태
  private _keys: Map<KeyCode, boolean> = new Map();

  onLoad() {
    this._rigidbody = this.getComponent(RigidBody2D);
    this._anim = this.getComponent(Animation);
    this._hp = this.maxHp;
    this.initializeInput();
  }

  private initializeInput() {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  private onKeyDown(event: EventKeyboard) {
    this._keys.set(event.keyCode, true);

    // 대시 처리
    if (event.keyCode === KeyCode.SPACE) {
      this.tryDash();
    }
  }

  private onKeyUp(event: EventKeyboard) {
    this._keys.delete(event.keyCode);
  }

  update(deltaTime: number) {
    if (GameManager.instance.gameState !== GameState.PLAYING) return;

    this.handleMovement(deltaTime);
    this.updateAnimation();
  }

  private handleMovement(deltaTime: number) {
    // 이동 방향 계산
    this._moveDirection.set(0, 0, 0);

    if (this._keys.get(KeyCode.KEY_W) || this._keys.get(KeyCode.ARROW_UP)) {
      this._moveDirection.y += 1;
    }
    if (this._keys.get(KeyCode.KEY_S) || this._keys.get(KeyCode.ARROW_DOWN)) {
      this._moveDirection.y -= 1;
    }
    if (this._keys.get(KeyCode.KEY_A) || this._keys.get(KeyCode.ARROW_LEFT)) {
      this._moveDirection.x -= 1;
      this._facingLeft = true;
    }
    if (this._keys.get(KeyCode.KEY_D) || this._keys.get(KeyCode.ARROW_RIGHT)) {
      this._moveDirection.x += 1;
      this._facingLeft = false;
    }

    // 대각선 이동 정규화
    if (this._moveDirection.x !== 0 && this._moveDirection.y !== 0) {
      this._moveDirection.normalize();
    }

    // 속도 적용
    const currentSpeed = this._isDashing ? this.dashSpeed : this.speed;
    const movement = this._moveDirection.multiplyScalar(
      currentSpeed * deltaTime
    );

    // 위치 업데이트
    const currentPos = this.node.position;
    this.node.setPosition(
      currentPos.x + movement.x,
      currentPos.y + movement.y,
      currentPos.z
    );

    // 이동 상태 업데이트
    this._isMoving = this._moveDirection.x !== 0 || this._moveDirection.y !== 0;
  }

  private tryDash() {
    if (!this._canDash || this._isDashing || this._dashCharges <= 0) return;

    this._isDashing = true;
    this._canDash = false;
    this._dashCharges--;
    this._lastDashTime = Date.now();

    // 대시 종료
    this.scheduleOnce(() => {
      this._isDashing = false;
    }, this.dashDuration / 1000);

    // 대시 쿨다운
    this.scheduleOnce(() => {
      this._canDash = true;
      this.rechargeDash();
    }, this.dashCooldown / 1000);
  }

  private rechargeDash() {
    if (this._dashCharges < this.maxDashCharges) {
      this._dashCharges++;
    }
  }

  private updateAnimation() {
    // 애니메이션 상태 업데이트
    if (this._isMoving) {
      this._anim?.play("player_move");
    } else {
      this._anim?.play("player_idle");
    }

    // 방향에 따른 스케일 조정
    const scale = this.node.scale;
    scale.x = Math.abs(scale.x) * (this._facingLeft ? -1 : 1);
    this.node.scale = scale;
  }

  public takeDamage(damage: number) {
    this._hp = Math.max(0, this._hp - damage);
    if (this._hp <= 0) {
      GameManager.instance.gameOver();
    }
  }

  // Getters
  public get hp(): number {
    return this._hp;
  }

  public get isDashing(): boolean {
    return this._isDashing;
  }

  public get dashCharges(): number {
    return this._dashCharges;
  }
}

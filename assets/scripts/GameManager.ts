import { _decorator, Component, Node, Vec3, director } from "cc";
const { ccclass, property } = _decorator;

export enum GameState {
  READY,
  PLAYING,
  PAUSED,
  GAME_OVER,
}

@ccclass("GameManager")
export class GameManager extends Component {
  private static _instance: GameManager = null;
  public static get instance(): GameManager {
    return GameManager._instance;
  }

  @property(Node)
  private player: Node = null;

  private _gameState: GameState = GameState.READY;
  private _score: number = 0;
  private _round: number = 1;

  // 라운드 관련 설정
  private readonly ROUND_DURATION: number = 25; // 25초
  private readonly ENEMIES_FOR_NEXT_ROUND: number = 10;
  private _enemiesKilledInRound: number = 0;
  private _roundStartTime: number = 0;

  onLoad() {
    if (GameManager._instance === null) {
      GameManager._instance = this;
    } else {
      this.node.destroy();
      return;
    }
    director.addPersistRootNode(this.node);
  }

  start() {
    this.initializeGame();
  }

  private initializeGame() {
    this._gameState = GameState.READY;
    this._score = 0;
    this._round = 1;
    this._enemiesKilledInRound = 0;
    this._roundStartTime = Date.now();
  }

  public startGame() {
    this._gameState = GameState.PLAYING;
    this._roundStartTime = Date.now();
  }

  public pauseGame() {
    if (this._gameState === GameState.PLAYING) {
      this._gameState = GameState.PAUSED;
    } else if (this._gameState === GameState.PAUSED) {
      this._gameState = GameState.PLAYING;
    }
  }

  public gameOver() {
    this._gameState = GameState.GAME_OVER;
  }

  public addScore(points: number) {
    this._score += points;
  }

  public enemyKilled() {
    this._enemiesKilledInRound++;
    if (this._enemiesKilledInRound >= this.ENEMIES_FOR_NEXT_ROUND) {
      this.nextRound();
    }
  }

  private nextRound() {
    this._round++;
    this._enemiesKilledInRound = 0;
    this._roundStartTime = Date.now();
  }

  // Getters
  public get gameState(): GameState {
    return this._gameState;
  }

  public get score(): number {
    return this._score;
  }

  public get round(): number {
    return this._round;
  }

  public get roundProgress(): number {
    const elapsed = (Date.now() - this._roundStartTime) / 1000;
    return Math.min(elapsed / this.ROUND_DURATION, 1);
  }
}

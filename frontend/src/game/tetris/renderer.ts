import {
  TETROMINOES,
  TetrominoType,
  type TetrisState,
} from '@transcendence/shared'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const GAP = 0.04

const BG_COLOR: [number, number, number] = [0.08, 0.08, 0.12]

const GHOST_ALPHA = 0.25

/** Classic Tetris color palette per piece type */
const PIECE_COLORS: Record<TetrominoType, [number, number, number]> = {
  [TetrominoType.I]: [0.0, 0.9, 0.9], // cyan
  [TetrominoType.O]: [0.9, 0.9, 0.0], // yellow
  [TetrominoType.T]: [0.6, 0.0, 0.8], // purple
  [TetrominoType.S]: [0.0, 0.9, 0.0], // green
  [TetrominoType.Z]: [0.9, 0.0, 0.0], // red
  [TetrominoType.J]: [0.0, 0.0, 0.9], // blue
  [TetrominoType.L]: [0.9, 0.5, 0.0], // orange
}

/* ------------------------------------------------------------------ */
/*  Shaders                                                           */
/* ------------------------------------------------------------------ */

const VERT_SRC = `#version 300 es
  in vec2 a_position;
  in vec3 a_color;
  in float a_alpha;

  out vec3 v_color;
  out float v_alpha;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_color = a_color;
    v_alpha = a_alpha;
  }
`

const FRAG_SRC = `#version 300 es
  precision mediump float;

  in vec3 v_color;
  in float v_alpha;
  out vec4 fragColor;

  void main() {
    fragColor = vec4(v_color, v_alpha);
  }
`

/* ------------------------------------------------------------------ */
/*  Renderer class                                                    */
/* ------------------------------------------------------------------ */

export class TetrisRenderer {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private vao: WebGLVertexArrayObject
  private posBuf: WebGLBuffer
  private colBuf: WebGLBuffer
  private alphaBuf: WebGLBuffer

  private boardPixelWidth = 0
  private boardPixelHeight = 0
  private previewSize = 0
  private canvasWidth = 0
  private canvasHeight = 0
  private _compact = false
  private rows = 20
  private cols = 10

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
    if (!gl) throw new Error('WebGL2 not supported')
    this.gl = gl

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.program = this.createProgram(VERT_SRC, FRAG_SRC)
    gl.useProgram(this.program)

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)

    this.posBuf = gl.createBuffer()!
    this.colBuf = gl.createBuffer()!
    this.alphaBuf = gl.createBuffer()!

    const posLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf)
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const colLoc = gl.getAttribLocation(this.program, 'a_color')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuf)
    gl.enableVertexAttribArray(colLoc)
    gl.vertexAttribPointer(colLoc, 3, gl.FLOAT, false, 0, 0)

    const alphaLoc = gl.getAttribLocation(this.program, 'a_alpha')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuf)
    gl.enableVertexAttribArray(alphaLoc)
    gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0)

    gl.bindVertexArray(null)
  }

  /* ---------------------------------------------------------------- */
  /*  Public API                                                       */
  /* ---------------------------------------------------------------- */

  set compact(value: boolean) {
    this._compact = value
  }

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    this.canvasWidth = width
    this.canvasHeight = height

    if (this._compact) {
      const cellSize = Math.floor(
        Math.min(width / this.cols, height / this.rows),
      )
      this.boardPixelWidth = cellSize * this.cols
      this.boardPixelHeight = cellSize * this.rows
      this.previewSize = 0
    } else {
      const cellSize = Math.floor(
        Math.min((width - 40) / (this.cols + 8), height / this.rows),
      )
      this.boardPixelWidth = cellSize * this.cols
      this.boardPixelHeight = cellSize * this.rows
      this.previewSize = cellSize * 4
    }
  }

  render(state: TetrisState) {
    const rows = state.board.length
    const cols = state.board[0]?.length ?? 10
    if (rows !== this.rows || cols !== this.cols) {
      this.rows = rows
      this.cols = cols
      this.resize(this.canvasWidth, this.canvasHeight)
    }

    const positions: number[] = []
    const colors: number[] = []
    const alphas: number[] = []

    const cellW = this.boardPixelWidth / cols
    const cellH = this.boardPixelHeight / rows

    const boardOffX = (this.canvasWidth - this.boardPixelWidth) / 2
    const boardOffY = (this.canvasHeight - this.boardPixelHeight) / 2

    const pushQuad = (
      px: number,
      py: number,
      w: number,
      h: number,
      r: number,
      g: number,
      b: number,
      a: number,
    ) => {
      const x0 = (px / this.canvasWidth) * 2 - 1
      const y0 = 1 - (py / this.canvasHeight) * 2 // flip Y
      const x1 = ((px + w) / this.canvasWidth) * 2 - 1
      const y1 = 1 - ((py + h) / this.canvasHeight) * 2

      positions.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1)
      for (let i = 0; i < 6; i++) {
        colors.push(r, g, b)
        alphas.push(a)
      }
    }

    pushQuad(
      boardOffX,
      boardOffY,
      this.boardPixelWidth,
      this.boardPixelHeight,
      BG_COLOR[0],
      BG_COLOR[1],
      BG_COLOR[2],
      1.0,
    )

    for (let row = 0; row <= rows; row++) {
      pushQuad(
        boardOffX,
        boardOffY + row * cellH,
        this.boardPixelWidth,
        1,
        0.2,
        0.2,
        0.25,
        0.5,
      )
    }
    for (let col = 0; col <= cols; col++) {
      pushQuad(
        boardOffX + col * cellW,
        boardOffY,
        1,
        this.boardPixelHeight,
        0.2,
        0.2,
        0.25,
        0.5,
      )
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = state.board[r][c]
        if (cell === 0) continue
        const color = PIECE_COLORS[cell as TetrominoType] ?? [0.5, 0.5, 0.5]
        const px = boardOffX + c * cellW + GAP * cellW
        const py = boardOffY + r * cellH + GAP * cellH
        pushQuad(
          px,
          py,
          cellW * (1 - 2 * GAP),
          cellH * (1 - 2 * GAP),
          color[0],
          color[1],
          color[2],
          1.0,
        )
      }
    }

    const ghostBlocks =
      TETROMINOES[state.currentPiece.type][state.currentPiece.rotation]
    const ghostColor = PIECE_COLORS[state.currentPiece.type]
    for (const [br, bc] of ghostBlocks) {
      const r = state.ghostRow + br
      const c = state.currentPiece.col + bc
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue
      const px = boardOffX + c * cellW + GAP * cellW
      const py = boardOffY + r * cellH + GAP * cellH
      pushQuad(
        px,
        py,
        cellW * (1 - 2 * GAP),
        cellH * (1 - 2 * GAP),
        ghostColor[0],
        ghostColor[1],
        ghostColor[2],
        GHOST_ALPHA,
      )
    }

    const curBlocks =
      TETROMINOES[state.currentPiece.type][state.currentPiece.rotation]
    const curColor = PIECE_COLORS[state.currentPiece.type]
    for (const [br, bc] of curBlocks) {
      const r = state.currentPiece.row + br
      const c = state.currentPiece.col + bc
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue
      const px = boardOffX + c * cellW + GAP * cellW
      const py = boardOffY + r * cellH + GAP * cellH
      pushQuad(
        px,
        py,
        cellW * (1 - 2 * GAP),
        cellH * (1 - 2 * GAP),
        curColor[0],
        curColor[1],
        curColor[2],
        1.0,
      )
    }

    if (!this._compact) {
      const previewX = boardOffX + this.boardPixelWidth + 20
      const previewY = boardOffY + 10
      const prevCellSize = this.previewSize / 4

      const renderPiecePreview = (
        type: TetrominoType,
        x: number,
        y: number,
        alpha = 1.0,
      ) => {
        const blocks = TETROMINOES[type][0]
        const color = PIECE_COLORS[type]
        for (const [br, bc] of blocks) {
          const px = x + (bc + 1.5) * prevCellSize + GAP * prevCellSize
          const py = y + (br + 1.5) * prevCellSize + GAP * prevCellSize
          pushQuad(
            px,
            py,
            prevCellSize * (1 - 2 * GAP),
            prevCellSize * (1 - 2 * GAP),
            color[0],
            color[1],
            color[2],
            alpha,
          )
        }
      }

      const renderPreviewPanel = (x: number, y: number) => {
        pushQuad(
          x - 5,
          y - 5,
          this.previewSize + 10,
          this.previewSize + 10,
          BG_COLOR[0],
          BG_COLOR[1],
          BG_COLOR[2],
          0.8,
        )
      }

      const nextPieces = state.nextPieces?.length
        ? state.nextPieces
        : [state.nextPiece]
      nextPieces.forEach((nextPiece, index) => {
        const y = previewY + index * (this.previewSize + 10)
        renderPreviewPanel(previewX, y)
        renderPiecePreview(nextPiece, previewX, y)
      })

      if (state.heldPiece) {
        const holdX = boardOffX - this.previewSize - 20
        const holdY = previewY
        renderPreviewPanel(holdX, holdY)
        renderPiecePreview(
          state.heldPiece,
          holdX,
          holdY,
          state.canHold ? 1.0 : 0.45,
        )
      }
    }

    const gl = this.gl
    gl.clearColor(0.05, 0.05, 0.08, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW)

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2)
    gl.bindVertexArray(null)
  }

  destroy() {
    const gl = this.gl
    gl.deleteBuffer(this.posBuf)
    gl.deleteBuffer(this.colBuf)
    gl.deleteBuffer(this.alphaBuf)
    gl.deleteVertexArray(this.vao)
    gl.deleteProgram(this.program)
  }

  /* ---------------------------------------------------------------- */
  /*  Internal helpers                                                 */
  /* ---------------------------------------------------------------- */

  private createProgram(vertSrc: string, fragSrc: string): WebGLProgram {
    const gl = this.gl
    const vs = this.compileShader(gl.VERTEX_SHADER, vertSrc)
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragSrc)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Program link failed: ' + gl.getProgramInfoLog(prog))
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return prog
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile failed: ' + gl.getShaderInfoLog(shader))
    }
    return shader
  }
}

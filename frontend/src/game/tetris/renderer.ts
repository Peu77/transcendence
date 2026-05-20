import {
  BOARD_COLS,
  BOARD_ROWS,
  PIECE_COLORS,
  TETROMINOES,
  TetrominoType,
  type TetrisState,
} from './types'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const GAP = 0.04

const BG_COLOR: [number, number, number] = [0.08, 0.08, 0.12]

const GHOST_ALPHA = 0.25

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
  private holdPreviewSize = 0
  private nextPreviewSize = 0
  private canvasWidth = 0
  private canvasHeight = 0

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

  resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    this.canvasWidth = width
    this.canvasHeight = height

    // Reserve room on both sides: hold panel on the left, next queue on the right.
    const cellSize = Math.floor(
      Math.min((width - 40) / (BOARD_COLS + 8), height / BOARD_ROWS),
    )
    this.boardPixelWidth = cellSize * BOARD_COLS
    this.boardPixelHeight = cellSize * BOARD_ROWS
    this.previewSize = cellSize * 4
    this.holdPreviewSize = Math.floor(cellSize * 3)
    this.nextPreviewSize = Math.min(
      this.holdPreviewSize,
      Math.floor((this.boardPixelHeight - 10 - 4 * 6) / 5),
    )
  }

  render(state: TetrisState) {
    const positions: number[] = []
    const colors: number[] = []
    const alphas: number[] = []

    const cellW = this.boardPixelWidth / BOARD_COLS
    const cellH = this.boardPixelHeight / BOARD_ROWS

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

    for (let row = 0; row <= BOARD_ROWS; row++) {
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
    for (let col = 0; col <= BOARD_COLS; col++) {
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

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
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
      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) continue
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
      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) continue
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

    const previewX = boardOffX + this.boardPixelWidth + 20
    const previewY = boardOffY + 10
    const prevCellSize = this.previewSize / 4

    const renderPiecePreview = (
      type: TetrominoType,
      x: number,
      y: number,
      cs: number,
      alpha = 1.0,
    ) => {
      const blocks = TETROMINOES[type][0]
      const color = PIECE_COLORS[type]
      const bcValues = blocks.map(([, c]) => c)
      const brValues = blocks.map(([r]) => r)
      const minBc = Math.min(...bcValues)
      const maxBc = Math.max(...bcValues)
      const minBr = Math.min(...brValues)
      const maxBr = Math.max(...brValues)
      const colOffset = (4 - (maxBc - minBc + 1)) / 2 - minBc
      const rowOffset = (4 - (maxBr - minBr + 1)) / 2 - minBr
      for (const [br, bc] of blocks) {
        const px = x + (bc + colOffset) * cs + GAP * cs
        const py = y + (br + rowOffset) * cs + GAP * cs
        pushQuad(
          px,
          py,
          cs * (1 - 2 * GAP),
          cs * (1 - 2 * GAP),
          color[0],
          color[1],
          color[2],
          alpha,
        )
      }
    }

    const renderPreviewPanel = (x: number, y: number, size: number) => {
      pushQuad(
        x - 5,
        y - 5,
        size + 10,
        size + 10,
        BG_COLOR[0],
        BG_COLOR[1],
        BG_COLOR[2],
        0.8,
      )
    }

    const nextPieces = state.nextPieces?.length
      ? state.nextPieces
      : [state.nextPiece]
    const nextCs = this.nextPreviewSize / 4
    nextPieces.forEach((nextPiece, index) => {
      const y = previewY + index * (this.nextPreviewSize + 6)
      renderPreviewPanel(previewX, y, this.nextPreviewSize)
      renderPiecePreview(nextPiece, previewX, y, nextCs)
    })

    const holdSlotX = boardOffX - this.previewSize - 20
    const holdPanelX = holdSlotX + (this.previewSize - this.holdPreviewSize) / 2
    const holdY = previewY
    const holdCs = this.holdPreviewSize / 4
    renderPreviewPanel(holdPanelX, holdY, this.holdPreviewSize)
    if (state.heldPiece) {
      renderPiecePreview(
        state.heldPiece,
        holdPanelX,
        holdY,
        holdCs,
        state.canHold ? 1.0 : 0.45,
      )
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

  getLayout() {
    const boardOffX = (this.canvasWidth - this.boardPixelWidth) / 2
    const boardOffY = (this.canvasHeight - this.boardPixelHeight) / 2
    const previewY = boardOffY + 10
    const holdSlotX = boardOffX - this.previewSize - 20
    return {
      holdX: holdSlotX + (this.previewSize - this.holdPreviewSize) / 2,
      holdY: previewY,
      holdPanelSize: this.holdPreviewSize,
      nextX: boardOffX + this.boardPixelWidth + 20,
      nextY: previewY,
      nextPanelSize: this.nextPreviewSize,
    }
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

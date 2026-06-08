import {
  TETROMINOES,
  TetrominoType,
  type TetrisState,
} from '@transcendence/shared'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const GAP = 0.04
const SIDE_GAP = 20
const PREVIEW_SCALE = 0.5

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
  in vec2 a_uv;
  in float a_material;

  out vec3 v_color;
  out float v_alpha;
  out vec2 v_uv;
  out float v_material;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_color = a_color;
    v_alpha = a_alpha;
    v_uv = a_uv;
    v_material = a_material;
  }
`

const FRAG_SRC = `#version 300 es
  precision highp float;

  in vec3 v_color;
  in float v_alpha;
  in vec2 v_uv;
  in float v_material;

  uniform vec2 u_resolution;
  uniform float u_time;

  out vec4 fragColor;

  void main() {
    if (v_material < 0.5) {
      vec2 screenUv = gl_FragCoord.xy / u_resolution;
      float scanline = sin(gl_FragCoord.y * 0.55 + u_time * 1.8) * 0.018;
      float vignette = 1.0 - 0.18 * length(screenUv - 0.5);
      vec3 background = (v_color + scanline) * vignette;
      fragColor = vec4(background, v_alpha);
      return;
    }

    float edgeDistance = min(
      min(v_uv.x, 1.0 - v_uv.x),
      min(v_uv.y, 1.0 - v_uv.y)
    );

    if (v_material < 1.5) {
      float border = 1.0 - smoothstep(0.035, 0.12, edgeDistance);
      float innerEdge = 1.0 - smoothstep(0.12, 0.24, edgeDistance);
      float diagonalLight = clamp((1.0 - v_uv.y) * 0.7 + (1.0 - v_uv.x) * 0.3, 0.0, 1.0);
      float pulse = 0.97 + 0.03 * sin(u_time * 2.4 + gl_FragCoord.x * 0.035);

      vec3 color = v_color * (0.72 + diagonalLight * 0.42);
      color += v_color * innerEdge * 0.18;
      color += vec3(0.9, 0.97, 1.0) * border * 0.3;
      color *= pulse;

      float cornerCut = smoothstep(0.0, 0.055, min(v_uv.x + v_uv.y, 2.0 - v_uv.x - v_uv.y));
      fragColor = vec4(color, v_alpha * cornerCut);
      return;
    }

    float outline = 1.0 - smoothstep(0.055, 0.14, edgeDistance);
    float scan = 0.55 + 0.45 * sin(gl_FragCoord.y * 0.8 - u_time * 5.0);
    vec3 ghostColor = mix(v_color * 0.45, v_color + vec3(0.35), outline);
    float ghostAlpha = v_alpha * (0.18 + outline * 2.3 + scan * 0.12);
    fragColor = vec4(ghostColor, clamp(ghostAlpha, 0.0, 0.85));
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
  private uvBuf: WebGLBuffer
  private materialBuf: WebGLBuffer
  private resolutionLoc: WebGLUniformLocation | null
  private timeLoc: WebGLUniformLocation | null

  private boardPixelWidth = 0
  private boardPixelHeight = 0
  private prevCellSize = 0
  private canvasWidth = 0
  private canvasHeight = 0
  private rows = 20
  private cols = 10

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    })
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
    this.uvBuf = gl.createBuffer()!
    this.materialBuf = gl.createBuffer()!

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

    const uvLoc = gl.getAttribLocation(this.program, 'a_uv')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf)
    gl.enableVertexAttribArray(uvLoc)
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0)

    const materialLoc = gl.getAttribLocation(this.program, 'a_material')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.materialBuf)
    gl.enableVertexAttribArray(materialLoc)
    gl.vertexAttribPointer(materialLoc, 1, gl.FLOAT, false, 0, 0)

    this.resolutionLoc = gl.getUniformLocation(this.program, 'u_resolution')
    this.timeLoc = gl.getUniformLocation(this.program, 'u_time')

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

    // Side panel = 4 preview cells wide = 4 * PREVIEW_SCALE * cellSize
    // Total width = sidePanel + gap + board + gap + sidePanel
    //             = 4*PS*cs + SIDE_GAP + cols*cs + SIDE_GAP + 4*PS*cs
    //             = cs * (cols + 8*PS) + 2*SIDE_GAP
    const cs = Math.floor(
      Math.min(
        (width - 2 * SIDE_GAP) / (this.cols + 8 * PREVIEW_SCALE),
        height / this.rows,
      ),
    )
    this.prevCellSize = Math.floor(cs * PREVIEW_SCALE)
    this.boardPixelWidth = cs * this.cols
    this.boardPixelHeight = cs * this.rows
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
    const uvs: number[] = []
    const materials: number[] = []

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
      material = 0,
    ) => {
      const x0 = (px / this.canvasWidth) * 2 - 1
      const y0 = 1 - (py / this.canvasHeight) * 2 // flip Y
      const x1 = ((px + w) / this.canvasWidth) * 2 - 1
      const y1 = 1 - ((py + h) / this.canvasHeight) * 2

      positions.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1)
      uvs.push(0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1)
      for (let i = 0; i < 6; i++) {
        colors.push(r, g, b)
        alphas.push(a)
        materials.push(material)
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
          1,
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
        2,
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
        1,
      )
    }

    {
      const pcs = this.prevCellSize
      const panelW = pcs * 4
      const panelH = pcs * 4

      const renderPiecePreview = (
        type: TetrominoType,
        x: number,
        y: number,
        alpha = 1.0,
      ) => {
        const blocks = TETROMINOES[type][0]
        const color = PIECE_COLORS[type]
        // Center piece within the 4×4 panel
        const minR = Math.min(...blocks.map(([r]) => r))
        const maxR = Math.max(...blocks.map(([r]) => r))
        const minC = Math.min(...blocks.map(([, c]) => c))
        const maxC = Math.max(...blocks.map(([, c]) => c))
        const pieceH = maxR - minR + 1
        const pieceW = maxC - minC + 1
        const offX = (panelW - pieceW * pcs) / 2 - minC * pcs
        const offY = (panelH - pieceH * pcs) / 2 - minR * pcs
        for (const [br, bc] of blocks) {
          const px = x + offX + bc * pcs + GAP * pcs
          const py = y + offY + br * pcs + GAP * pcs
          pushQuad(
            px,
            py,
            pcs * (1 - 2 * GAP),
            pcs * (1 - 2 * GAP),
            color[0],
            color[1],
            color[2],
            alpha,
            1,
          )
        }
      }

      const renderPanel = (x: number, y: number, h: number) => {
        pushQuad(x, y, panelW, h, BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], 0.8)
      }

      // Next pieces — right of board
      const nextX = boardOffX + this.boardPixelWidth + SIDE_GAP
      const nextY = boardOffY
      const nextPieces = state.nextPieces?.length
        ? state.nextPieces
        : [state.nextPiece]
      const nextTotalH = nextPieces.length * panelH
      renderPanel(nextX, nextY, nextTotalH)
      nextPieces.forEach((nextPiece, index) => {
        renderPiecePreview(nextPiece, nextX, nextY + index * panelH)
      })

      // Hold piece — left of board
      const holdX = boardOffX - SIDE_GAP - panelW
      const holdY = boardOffY
      renderPanel(holdX, holdY, panelH)
      if (state.heldPiece) {
        renderPiecePreview(
          state.heldPiece,
          holdX,
          holdY,
          state.canHold ? 1.0 : 0.45,
        )
      }
    }

    const gl = this.gl
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.materialBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(materials), gl.DYNAMIC_DRAW)

    gl.uniform2f(this.resolutionLoc, this.canvas.width, this.canvas.height)
    gl.uniform1f(this.timeLoc, performance.now() / 1000)

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
    gl.deleteBuffer(this.uvBuf)
    gl.deleteBuffer(this.materialBuf)
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

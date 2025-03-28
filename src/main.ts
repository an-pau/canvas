import './style.css';

class DrawingCanvas {
  sizeSlider: HTMLInputElement;
  clearBtn: HTMLButtonElement;
  undoBtn: HTMLButtonElement;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isDrawing: boolean;
  lastSavedX: number;
  lastSavedY: number;
  brushWidth: number;
  selectedColor: string;

  /** @note Undo action would use a stack DS with push/pop method */
  constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.sizeSlider = document.getElementById("size-slider") as HTMLInputElement;
    this.clearBtn = document.getElementById("clear") as HTMLButtonElement;
    this.undoBtn = document.getElementById("undo") as HTMLButtonElement;

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    this.isDrawing = false;
    this.lastSavedX = 0;
    this.lastSavedY = 0;
    this.brushWidth = 4;
    this.selectedColor = "black";

    this.initEvents();
  }

  initEvents() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.canvas.addEventListener("mousedown", (e) => {
      this.startDrawing(e);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.isDrawing) return;
      this.drawPencil(e);
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isDrawing = false;
    });

    this.sizeSlider.addEventListener("change", () => {
      this.brushWidth = Number(this.sizeSlider.value);
    })

    this.clearBtn.addEventListener("click", () => {
      this.clear();
    });

    this.undoBtn.addEventListener("click", () => {
      this.undo();
    });
  }

  drawPencil(e: MouseEvent) {
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }

  startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    this.lastSavedX = e.offsetX;
    this.lastSavedY = e.offsetY;
    
    this.ctx.lineWidth = this.brushWidth;
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.fillStyle = this.selectedColor;

    this.ctx.beginPath();
  }

  undo() {}

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

new DrawingCanvas();

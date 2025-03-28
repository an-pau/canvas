import "./style.css";

class DrawingCanvas {
  sizeSlider: HTMLInputElement;
  clearBtn: HTMLButtonElement;
  undoBtn: HTMLButtonElement;
  redoBtn: HTMLButtonElement;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  isDrawing: boolean;
  lastSavedX: number;
  lastSavedY: number;
  brushWidth: number;
  selectedColor: string;

  past: Array<ImageData>;
  current: Array<ImageData>;
  future: Array<ImageData>;

  /** @note @todo Undo/Redo actions using stack DS with push/pop method */
  constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.sizeSlider = document.getElementById(
      "size-slider",
    ) as HTMLInputElement;
    this.clearBtn = document.getElementById("clear") as HTMLButtonElement;
    this.undoBtn = document.getElementById("undo") as HTMLButtonElement;
    this.redoBtn = document.getElementById("redo") as HTMLButtonElement;

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    this.isDrawing = false;
    this.lastSavedX = 0;
    this.lastSavedY = 0;
    this.brushWidth = 4;
    this.selectedColor = "black";

    this.past = [];
    this.current = [];
    this.future = [];

    this.initEvents();
  }

  initEvents() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    this.ctx.lineWidth = this.brushWidth;
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.fillStyle = this.selectedColor;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.canvas.addEventListener("mousedown", (e) => {
      this.start(e);
    });

    /** @todo Limit how long a user can click off canvas */
    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.isDrawing) return;
      this.draw(e);
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isDrawing = false;

      this.past.push(this.current[0]);
      this.current = [];
    });

    this.sizeSlider.addEventListener("change", () => {
      this.brushWidth = Number(this.sizeSlider.value);
    });

    this.clearBtn.addEventListener("click", () => {
      this.clear();
    });

    this.undoBtn.addEventListener("click", () => {
      this.undo();
    });

    this.redoBtn.addEventListener("click", () => {
      this.redo();
    });
  }

  draw(e: MouseEvent) {
    const currentImageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    this.current.push(currentImageData);

    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }

  start(e: MouseEvent) {
    this.isDrawing = true;
    this.lastSavedX = e.clientX;
    this.lastSavedY = e.clientY;

    this.ctx.beginPath();
  }

  redraw(action: "undo" | "redo") {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (action) {
      case "undo":
        const lastAddedImageData = this.past.pop();
        if (lastAddedImageData) {
          this.future.unshift(lastAddedImageData);
          this.ctx.putImageData(lastAddedImageData, 0, 0);
        }
        break;
      case "redo":
        const lastRemovedImageData = this.future.shift();
        if (lastRemovedImageData) {
          this.ctx.putImageData(lastRemovedImageData, 0, 0);
          this.past.push(lastRemovedImageData);
        }
        break;
      default:
    }
  }

  undo() {
    if (this.past.length > 0) {
      this.redraw("undo");
    }
  }

  redo() {
    if (this.future.length > 0) {
      this.redraw("redo");
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.past = [];
    this.current = [];
  }
}

new DrawingCanvas();

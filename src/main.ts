import { v4 as uuidv4 } from "uuid";
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
    selectedColor: string;
    keysPressed: { [key: string]: boolean };

    past: Array<{
        id: string;
        data: ImageData;
    }>;
    current: Array<{
        id: string;
        data: ImageData;
    }>;
    future: Array<{
        id: string;
        data: ImageData;
    }>;

    /** @note @todo Undo/Redo actions using stack DS with push/pop method */
    /** Set limit for how many actions/images are saved */
    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.sizeSlider = document.getElementById(
            "size-slider"
        ) as HTMLInputElement;
        this.clearBtn = document.getElementById("clear") as HTMLButtonElement;
        this.undoBtn = document.getElementById("undo") as HTMLButtonElement;
        this.redoBtn = document.getElementById("redo") as HTMLButtonElement;

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", {
            willReadFrequently: true,
        }) as CanvasRenderingContext2D;

        this.isDrawing = false;
        this.lastSavedX = 0;
        this.lastSavedY = 0;
        this.selectedColor = "black";

        this.past = [];
        this.current = [];
        this.future = [];
        this.keysPressed = {};

        this.initEvents();
    }

    initEvents() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = this.selectedColor;
        this.ctx.fillStyle = this.selectedColor;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        this.undoBtn.disabled = true;
        this.redoBtn.disabled = true;

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
            this.undoBtn.disabled = false;
            this.current = [];
        });

        this.sizeSlider.addEventListener("change", () => {
            this.ctx.lineWidth = Number(this.sizeSlider.value);
        });

        this.clearBtn.addEventListener("click", () => {
            this.clear();
        });

        this.undoBtn.addEventListener("click", () => {
            if (this.past.length > 0) {
                this.undo();
            } else {
                this.undoBtn.disabled = true;
            }
        });

        this.redoBtn.addEventListener("click", () => {
            if (this.future.length > 0) {
                this.redo();
            } else {
                this.redoBtn.disabled = true;
            }
        });

        document.addEventListener("keydown", (event) => {
            this.keysPressed[event.key] = true;

            if (this.keysPressed["Control"] && event.key == "z") {
                this.undo();
            }
        });

        document.addEventListener("keyup", (event) => {
            delete this.keysPressed[event.key];
        });
    }

    draw(e: MouseEvent) {
        const currentImageData = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        const uniqueId = uuidv4();
        this.current.push({
            id: uniqueId,
            data: currentImageData,
        });

        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
    }

    start(e: MouseEvent) {
        this.isDrawing = true;
        this.lastSavedX = e.clientX;
        this.lastSavedY = e.clientY;

        this.ctx.beginPath();
    }

    undo() {
        const past = [...this.past];
        const future = [...this.future];

        const lastAddedImage = past.pop();
        this.past = [...past];

        if (lastAddedImage) {
            future.unshift(lastAddedImage);
            this.future = [...future];
            this.redoBtn.disabled = false;
            this.ctx.putImageData(lastAddedImage.data, 0, 0);
        }
    }

    redo() {
        const past = [...this.past];
        const future = [...this.future];

        const lastRemovedImage = future.shift();
        this.future = [...future];

        if (lastRemovedImage) {
            past.push(lastRemovedImage);
            this.past = [...past];
            this.ctx.putImageData(lastRemovedImage.data, 0, 0);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.past = [];
        this.current = [];
        this.undoBtn.disabled = true;
        this.redoBtn.disabled = true;
    }
}

new DrawingCanvas();

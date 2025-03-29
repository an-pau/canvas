import { v4 as uuidv4 } from "uuid";
import "./style.css";

class DrawingCanvas {
    sizeSlider: HTMLInputElement;
    clearBtn: HTMLButtonElement;
    undoBtn: HTMLButtonElement;
    redoBtn: HTMLButtonElement;
    colorSelectBtns: HTMLCollectionOf<Element>;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    isDrawing: boolean;
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
        this.colorSelectBtns = document.getElementsByClassName(
            "brush-select"
        ) as HTMLCollectionOf<Element>;

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", {
            willReadFrequently: true,
        }) as CanvasRenderingContext2D;

        this.isDrawing = false;
        this.selectedColor = "black";
        this.keysPressed = {};

        this.past = [];
        this.current = [];
        this.future = [];

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

        this.canvas.addEventListener("mousedown", () => {
            this.start();
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
            this.undo();
        });

        this.redoBtn.addEventListener("click", () => {
            this.redo();
        });

        Array.from(this.colorSelectBtns).forEach((el: Element) => {
            el.addEventListener("click", () => {
                const brushColor = el.getAttribute("data-br-color");
                if (brushColor) {
                    this.selectedColor = brushColor;
                    this.ctx.strokeStyle = brushColor;
                    this.ctx.fillStyle = brushColor;
                }
            });
        });

        document.addEventListener("keydown", (event) => {
            this.keysPressed[event.key] = true;

            if (this.keysPressed["Control"] && this.keysPressed["z"]) {
                this.undo();
            }

            if (
                this.keysPressed["Control"] &&
                this.keysPressed["Shift"] &&
                this.keysPressed["z"]
            ) {
                this.redo();
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

    start() {
        this.isDrawing = true;
        this.ctx.beginPath();
    }

    undo() {
        const past = structuredClone(this.past);
        const future = structuredClone(this.future);

        const lastAddedImage = past.pop();
        this.past = structuredClone(past);

        if (lastAddedImage) {
            future.unshift(lastAddedImage);
            this.future = structuredClone(future);
            this.redoBtn.disabled = false;

            this.ctx.putImageData(lastAddedImage.data, 0, 0);
        }

        if (this.past.length < 1) {
            this.undoBtn.disabled = true;
        }
    }

    redo() {
        const past = structuredClone(this.past);
        const future = structuredClone(this.future);

        const lastRemovedImage = future.shift();
        this.future = structuredClone(future);

        if (lastRemovedImage) {
            past.push(lastRemovedImage);
            this.past = structuredClone(past);
            console.log(lastRemovedImage);

            this.ctx.putImageData(lastRemovedImage.data, 0, 0);
        }

        if (this.future.length < 1) {
            this.redoBtn.disabled = true;
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

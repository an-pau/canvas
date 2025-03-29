import { v4 as uuidv4 } from "uuid";
import { DEFAULT_CTX } from "./constants";
import "./style.scss";

class DrawingCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    colorSelectBtns: HTMLCollectionOf<Element>;
    sizeSlider: HTMLInputElement;
    undoBtn: HTMLButtonElement;
    redoBtn: HTMLButtonElement;
    clearBtn: HTMLButtonElement;
    saveBtn: HTMLButtonElement;

    isDrawing: boolean;
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

    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", {
            willReadFrequently: true,
        }) as CanvasRenderingContext2D;

        this.colorSelectBtns = document.getElementsByClassName(
            "brush-select"
        ) as HTMLCollectionOf<Element>;
        this.sizeSlider = document.getElementById(
            "size-slider"
        ) as HTMLInputElement;
        this.undoBtn = document.getElementById("undo") as HTMLButtonElement;
        this.redoBtn = document.getElementById("redo") as HTMLButtonElement;
        this.clearBtn = document.getElementById("clear") as HTMLButtonElement;
        this.saveBtn = document.getElementById("save") as HTMLButtonElement;

        this.isDrawing = false;
        this.keysPressed = {};

        /** @todo Set limit for how many actions/images are saved */
        this.past = [];
        this.current = [];
        this.future = [];

        this.initCanvas();
        this.initUserEvents();
        this.initDrawingEvents();
    }

    initCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        this.ctx.lineWidth = DEFAULT_CTX.lineWidth;
        this.ctx.strokeStyle = DEFAULT_CTX.strokeStyle;
        this.ctx.fillStyle = DEFAULT_CTX.fillStyle;
        this.ctx.lineCap = DEFAULT_CTX.lineCap;
        this.ctx.lineJoin = DEFAULT_CTX.lineJoin;
        // Sets canvas background
        this.ctx.fillRect(
            0,
            0,
            this.canvas.offsetWidth,
            this.canvas.offsetHeight
        );
    }

    initUserEvents() {
        this.undoBtn.disabled = true;
        this.redoBtn.disabled = true;

        this.sizeSlider.addEventListener("change", () => {
            this.ctx.lineWidth = Number(this.sizeSlider.value);
        });

        Array.from(this.colorSelectBtns).forEach((el: Element) => {
            el.addEventListener("click", () => {
                const brushColor = el.getAttribute("data-br-color");
                if (brushColor) {
                    this.ctx.strokeStyle = brushColor;
                    this.ctx.fillStyle = brushColor;
                }
            });
        });

        this.undoBtn.addEventListener("click", () => {
            this.undo();
        });

        this.redoBtn.addEventListener("click", () => {
            this.redo();
        });

        this.clearBtn.addEventListener("click", () => {
            this.clear();
        });

        this.saveBtn.addEventListener("click", () => {
            this.save();
        });

        // Listens for undo and redo keydown events
        document.addEventListener("keydown", (event) => {
            this.keysPressed[event.key] = true;
            console.log(this.keysPressed);

            const ctrlCmdPressed =
                navigator.userAgent.indexOf("Mac") != -1
                    ? this.keysPressed["Meta"]
                    : this.keysPressed["Control"];

            if (ctrlCmdPressed && this.keysPressed["z"]) {
                this.undo();
            }

            if (
                ctrlCmdPressed &&
                this.keysPressed["Shift"] &&
                this.keysPressed["Z"]
            ) {
                this.redo();
            }
        });

        // Clear previous keys pressed
        document.addEventListener("keyup", () => {
            for (const prop of Object.getOwnPropertyNames(this.keysPressed)) {
                delete this.keysPressed[prop];
            }
        });
    }

    /** @todo Limit how long a user can click off canvas */
    initDrawingEvents() {
        this.canvas.addEventListener("mousedown", () => {
            this.start();
        });

        this.canvas.addEventListener("mousemove", (e) => {
            // On mouse move, this.draw() is only called when drawing (mouse down)
            if (!this.isDrawing) return;
            this.draw(e);
        });

        this.canvas.addEventListener("mouseup", () => {
            this.isDrawing = false;

            // Once mouse up, current image can be stored away
            this.past.push(this.current[0]);
            this.undoBtn.disabled = false;
            // Reset current for next stroke
            this.current = [];
        });
    }

    draw(e: MouseEvent) {
        const currentImageData = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        // Unique ID helps us quickly distinguish stored image data
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

        /** @debug @todo Remove after fix */
        console.log("UNDO PAST", this.past);
        console.log("UNDO FUTURE", this.future);
    }

    redo() {
        const past = structuredClone(this.past);
        const future = structuredClone(this.future);

        const lastRemovedImage = future.shift();
        this.future = structuredClone(future);

        if (lastRemovedImage) {
            past.push(lastRemovedImage);
            this.past = structuredClone(past);

            this.ctx.putImageData(lastRemovedImage.data, 0, 0);
        }

        if (this.future.length < 1) {
            this.redoBtn.disabled = true;
        }

        /** @debug @todo Remove after fix */
        console.log("REDO PAST", this.past);
        console.log("REDO FUTURE", this.future);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.past = [];
        this.current = [];
        this.undoBtn.disabled = true;
        this.redoBtn.disabled = true;
    }

    save() {
        const dataURL = this.canvas.toDataURL("image/png", 1);
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "my_canvas";
        link.click();
    }
}

new DrawingCanvas();

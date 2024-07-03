interface Result {
    beforeElement: Element | null
    insertedElement: Element | null
    afterElement: Element | null
    order: Element[]
}

export class DragDrop {
	dropzones: Element[];
	draggables: Element[];
    result: Result;
    onDrop: (e: DragEvent, res: Result) => void;
    
	constructor(dropzones: Element[], draggables: Element[], onDrop: (e: DragEvent, res: Result) => void) {
        this.dropzones = dropzones;
        this.draggables = draggables;
        this.result = { beforeElement: null, insertedElement: null, afterElement: null, order: this.draggables };
        this.onDrop = onDrop;

        this.load();
	}

    private dragStart(draggable: Element, e: DragEvent) {
        draggable.toggleClass('is-dragging', true);
    }

    private dragOver(dropzone: Element, e: DragEvent) {
        e.preventDefault();
        this.result.beforeElement = this.getDragBeforeElement(e.clientX);
        this.result.insertedElement = this.getDraggingElement();
        this.result.afterElement = this.getDragAfterElement(e.clientX);


        const insertedIndex = this.draggables.indexOf(this.result.insertedElement);

        // If at the end of draggables
        if (this.result.afterElement === null) {
            // Append element
            dropzone.appendChild(this.result.insertedElement);
            // Remove element from order
            this.result.order.splice(insertedIndex, 1);
            // Add to end of order
            this.result.order.push(this.result.insertedElement);
        }
        else {
            // Place element between
            dropzone.insertBefore(this.result.insertedElement, this.result.afterElement);
            // Remove element from order
            this.result.order.splice(insertedIndex, 1);
            // Get the after index, post element removal
            const afterIndex = this.draggables.indexOf(this.result.afterElement);
            // Insert the element before the after index
            this.result.order.splice(afterIndex, 0, this.result.insertedElement);
        }
    }

    private dragEnd(draggable: Element, e: DragEvent) {
        draggable.toggleClass('is-dragging', false);
        this.onDrop(e, this.result);
        this.result = { beforeElement: null, insertedElement: null, afterElement: null, order: this.draggables };
    }

    public load() {
        for(let draggable of this.draggables) {
            // Important, so that all types of elements can be dragged, including divs & spans
            draggable.setAttribute('draggable', "true");

            draggable.addEventListener("dragstart", (e: DragEvent) => this.dragStart(draggable, e));
            draggable.addEventListener("dragend", (e: DragEvent) => this.dragEnd(draggable, e));
        }

        for(let dropzone of this.dropzones) {
            dropzone.addEventListener("dragover", (e: DragEvent) => this.dragOver(dropzone, e));
        }
    }

    public unload() {
        for(let draggable of this.draggables) {
            draggable.removeEventListener('dragstart', (e: DragEvent) => this.dragStart(draggable, e));
            draggable.removeEventListener('dragend', (e: DragEvent) => this.dragEnd(draggable, e));
        }

        for(let dropzone of this.dropzones) {
            dropzone.removeEventListener('dragover', (e: DragEvent) => this.dragOver(dropzone, e));
        }
    }

    /**
     * @returns The element which is being dragged
     */
    public getDraggingElement() {
        return this.draggables.filter((draggable) => draggable.hasClass('is-dragging'))[0];
    }

    /**
     * @returns All draggable elements not being dragged
     */
    public getDraggableElements() {
        return this.draggables.filter((draggable) => !draggable.hasClass('is-dragging'));
    }

    /**
     * Gets the closest element before the dragged element
     */
	private getDragBeforeElement(x: number) {
		return this.getDraggableElements().reduce((closest, child) => {
				const rect = child.getBoundingClientRect();
                const leftPosition = x - rect.left;
                const halfChildWidth = rect.width / 2;

				const offset = leftPosition - halfChildWidth;

                // Return the closest element to the right of the cursor
				if (offset > 0 && offset < closest.offset) return { offset, element: child }
                else return closest;
            }, 
            // Initial closest value
            { offset: Number.POSITIVE_INFINITY, element: null }
        )
        .element;
	}

    /**
     * Gets the closest element after the dragged element
     */
	private getDragAfterElement(x: number) {
		return this.getDraggableElements().reduce((closest, child) => {
				const rect = child.getBoundingClientRect();
                const leftPosition = x - rect.left;
                const halfChildWidth = rect.width / 2;

				const offset = leftPosition - halfChildWidth;

                // Return the closest element to the left of the cursor
				if (offset < 0 && offset > closest.offset) return { offset, element: child }
                else return closest;
            }, 
            // Initial closest value
            { offset: Number.NEGATIVE_INFINITY, element: null }
        )
        .element;
	}
}

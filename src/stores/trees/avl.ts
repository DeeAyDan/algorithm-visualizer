class AVLNode {
	value: number;
	height: number;
	left: AVLNode | null;
	right: AVLNode | null;

	constructor(value: number) {
		this.value = value;
		this.height = 1;
		this.left = null;
		this.right = null;
	}
}

class AVLTree {
	root: AVLNode | null = null;

	// --- Helper metódusok ---
	height(node: AVLNode | null): number {
		return node ? node.height : 0;
	}

	getBalance(node: AVLNode | null): number {
		return node ? this.height(node.left) - this.height(node.right) : 0;
	}

	updateHeight(node: AVLNode): void {
		node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
	}

	rotateRight(y: AVLNode): AVLNode {
		const x = y.left!;
		const T2 = x.right;

		x.right = y;
		y.left = T2;

		this.updateHeight(y);
		this.updateHeight(x);
		return x;
	}

	rotateLeft(x: AVLNode): AVLNode {
		const y = x.right!;
		const T2 = y.left;

		y.left = x;
		x.right = T2;

		this.updateHeight(x);
		this.updateHeight(y);
		return y;
	}

	// --- Beszúrás ---
	insert(value: number): void {
		this.root = this._insert(this.root, value);
	}

	private _insert(node: AVLNode | null, value: number): AVLNode {
		if (!node) return new AVLNode(value);
		if (value < node.value) node.left = this._insert(node.left, value);
		else if (value > node.value) node.right = this._insert(node.right, value);
		else return node; // Duplikált érték, nem szúrjuk be

		this.updateHeight(node);
		const balance = this.getBalance(node);

		// Bal-bal eset
		if (balance > 1 && value < node.left!.value) return this.rotateRight(node);
		// Jobb-jobb eset
		if (balance < -1 && value > node.right!.value) return this.rotateLeft(node);
		// Bal-jobb eset
		if (balance > 1 && value > node.left!.value) {
			node.left = this.rotateLeft(node.left!);
			return this.rotateRight(node);
		}
		// Jobb-bal eset
		if (balance < -1 && value < node.right!.value) {
			node.right = this.rotateRight(node.right!);
			return this.rotateLeft(node);
		}

		return node;
	}

	// --- Keresés ---
	search(value: number): boolean {
		let node = this.root;
		while (node) {
			if (value === node.value) return true;
			node = value < node.value ? node.left : node.right;
		}
		return false;
	}

	// --- Minimális érték keresése ---
	private minValueNode(node: AVLNode): AVLNode {
		let current = node;
		while (current.left) current = current.left;
		return current;
	}

	// --- Törlés ---
	delete(value: number): void {
		this.root = this._delete(this.root, value);
	}

	private _delete(node: AVLNode | null, value: number): AVLNode | null {
		if (!node) return null;

		if (value < node.value) node.left = this._delete(node.left, value);
		else if (value > node.value) node.right = this._delete(node.right, value);
		else {
			// Node found
			if (!node.left || !node.right) {
				node = node.left ?? node.right;
			} else {
				const minNode = this.minValueNode(node.right);
				node.value = minNode.value;
				node.right = this._delete(node.right, minNode.value);
			}
		}

		if (!node) return null;

		this.updateHeight(node);
		const balance = this.getBalance(node);

		if (balance > 1 && this.getBalance(node.left) >= 0) return this.rotateRight(node);
		if (balance > 1 && this.getBalance(node.left) < 0) {
			node.left = this.rotateLeft(node.left!);
			return this.rotateRight(node);
		}
		if (balance < -1 && this.getBalance(node.right) <= 0) return this.rotateLeft(node);
		if (balance < -1 && this.getBalance(node.right) > 0) {
			node.right = this.rotateRight(node.right!);
			return this.rotateLeft(node);
		}

		return node;
	}

    

	// Debug: inorder bejárás
	inOrder(): number[] {
		const res: number[] = [];
		function traverse(node: AVLNode | null) {
			if (!node) return;
			traverse(node.left);
			res.push(node.value);
			traverse(node.right);
		}
		traverse(this.root);
		return res;
	}
}

export const avl = new AVLTree();

// Fa vizualizációhoz: pozíció + szint
export interface VisualNode {
	value: number;
	x: number;
	y: number;
}

export function getVisualTreeData(): VisualNode[] {
	const result: VisualNode[] = [];

	function traverse(node: AVLNode | null, depth: number, x: number): void {
		if (!node) return;

		// egyszerű eltolás (később fejleszthető finomabb elrendezésre)
		result.push({ value: node.value, x, y: depth * 100 });
		traverse(node.left, depth + 1, x - 100 / (depth + 1));
		traverse(node.right, depth + 1, x + 100 / (depth + 1));
	}

	traverse(avl.root, 0, 500); // kiinduló X pozíció: 500px
	return result;
}



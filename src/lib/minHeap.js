/**
 * minHeap.js
 * Binary min-heap implemented from scratch (no heapq / priority-queue library).
 *
 * Complexity:
 *   push  — O(log n)
 *   pop   — O(log n)
 *   peek  — O(1)
 */
export class MinHeap {
  constructor() {
    /** @type {Array<[number, number]>} */
    this.data = []
  }

  /** @param {number} key @param {number} value */
  push(key, value) {
    this.data.push([key, value])
    this._siftUp(this.data.length - 1)
  }

  /** @returns {[number, number]} */
  pop() {
    if (this.data.length === 0) throw new Error('pop from empty heap')
    this._swap(0, this.data.length - 1)
    const min = this.data.pop()
    if (this.data.length) this._siftDown(0)
    return min
  }

  isEmpty() { return this.data.length === 0 }
  size()    { return this.data.length }

  _swap(i, j) {
    ;[this.data[i], this.data[j]] = [this.data[j], this.data[i]]
  }

  _siftUp(i) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.data[i][0] < this.data[p][0]) { this._swap(i, p); i = p }
      else break
    }
  }

  _siftDown(i) {
    const n = this.data.length
    while (true) {
      let s = i, l = 2 * i + 1, r = 2 * i + 2
      if (l < n && this.data[l][0] < this.data[s][0]) s = l
      if (r < n && this.data[r][0] < this.data[s][0]) s = r
      if (s === i) break
      this._swap(i, s); i = s
    }
  }
}

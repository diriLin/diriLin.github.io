/// <reference path="base.ts" />

'use strict'

class Index {
  private lastIndex: number = -1
  private headerLink: NodeList
  private tocLink: NodeList

  private setItem = (item: HTMLElement) => {
    item.classList.add('active')
    let parent = getParent(item), brother = parent.children
    for (let i = 0, length = brother.length; i < length; ++i) {
      const item = brother.item(i) as HTMLElement
      if (item.classList.contains('toc-child')) {
        item.classList.add('has-active')
        break
      }
    }
    for (; parent.classList[0] !== 'toc'; parent = getParent(parent)) {
      if (parent.classList[0] === 'toc-child') {
        parent.classList.add('has-active')
      }
    }
  }

  private reset = (not: HTMLElement) => {
    let tocs: NodeList = document.querySelectorAll('#toc-div .active')
    let tocTree: NodeList = document.querySelectorAll('#toc-div .has-active')
    tocs.forEach(item => {
      if (!item.contains(not)) {
        (item as HTMLElement).classList.remove('active')
      }
    })
    tocTree.forEach(item => {
      if (!(item.parentElement as HTMLElement).contains(not)) {
        (item as HTMLElement).classList.remove('has-active')
      }
    })
  }

  private check = (index: Array<number>, id: number) => {
    return index[id + 1] > 150 && (index[id] <= 150 || !id)
  }

  private modifyIndex = () => {
    let index: Array<number> = []
    this.headerLink.forEach(item => {
      index.push((item as HTMLElement).getBoundingClientRect().top)
    })
    if (this.lastIndex >= 0 && this.check(index, this.lastIndex)) {
      return
    }
    for (let i = 0; i < this.tocLink.length; ++i) {
      const item = this.tocLink.item(i) as HTMLElement
      if (i + 1 === index.length || this.check(index, i)) {
        this.setItem(item)
        this.reset(item)
        break
      }
    }
  }

  private setHTML = () => {
    this.headerLink = document.querySelectorAll('h2,h3,h4,h5,h6')
    this.tocLink = document.querySelectorAll('.toc-link')
    if (this.tocLink.length) {
      this.setItem(this.tocLink.item(0) as HTMLElement)
    }
  }

  constructor() {
    document.addEventListener('pjax:success', this.setHTML)
    this.setHTML()
    this.headerLink = document.querySelectorAll('h2,h3,h4,h5,h6')
    this.tocLink = document.querySelectorAll('.toc-link')
    getElement('main').addEventListener('scroll', () => {
      if (!this.tocLink.length) {
        return
      }
      this.modifyIndex()
    }, { passive: true })
  }
}

let indexs = new Index()

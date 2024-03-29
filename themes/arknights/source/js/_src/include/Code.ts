/// <reference path="base.ts" />

'use strict'

class Code {
  private reverse = (item: Element, s0: string, s1: string) => {
    const block = getParent(item)
    if (block.classList.contains(s0)) {
      block.classList.remove(s0)
      block.classList.add(s1)
    } else {
      block.classList.remove(s1)
      block.classList.add(s0)
    }
  }

  private doAsMermaid = (item: Element) => {
    let Amermaid = item.querySelector('.mermaid') as HTMLElement
    item.outerHTML = '<div class="highlight mermaid">' + Amermaid.innerText + '</div>'
  }

  private resetName = (str: string): string => {
    if (str == 'plaintext') {
      return 'TEXT'
    }
    if (str == 'cs') {
      return 'C#'
    }
    if (str == 'cpp') {
      return 'C++'
    }
    return str.toUpperCase()
  }

  private addEvent = (header: HTMLElement) => {
    header.addEventListener('click', (click) => {
      if (click.target === header) {
        this.reverse(header, 'open', 'fold')
      }
    })
    header.addEventListener('keypress', (key) => {
      if (key.key === 'Enter' && key.target === header) {
        this.reverse(header, 'open', 'fold')
      }
    })
  }

  private doAsCode = (item: Element) => {
    const codeType = this.resetName(item.classList[1]),
      lineCount = getElement('.gutter', item).children[0].childElementCount >> 1
    item.classList.add(lineCount < 16 ? 'open' : 'fold')
    item.innerHTML =
      `<span class="code-header" tabindex='0'>\
        <span class="code-title">\
          <div class="code-icon"></div>
          ${format(config.code.codeInfo, codeType, lineCount)}
        </span>\
        <span class="code-header-tail">\
          <button class="code-copy">${config.code.copy}</button>\
          <span class="code-space">${config.code.expand}</span>\
        </span>\
      </span>\
      <div class="code-box">${item.innerHTML}</div>`
    getElement('.code-copy', item).addEventListener('click', (click: Event) => {
      const button = click.target as HTMLElement
      navigator.clipboard.writeText(getElement('code', item).innerText)
      button.classList.add('copied')
      button.innerText = config.code.copyFinish
      setTimeout(() => {
        button.classList.remove('copied')
        button.innerText = config.code.copy
      }, 1200)
    })
    this.addEvent(getElement('.code-header', item))
  }

  private clearMermaid = () => {
    document.querySelectorAll('.mermaid').forEach((item) => {
      let style = item.querySelector('style')
      if (style) {
        style.remove()
      }
    })
  }

  public findCode = () => {
    let codeBlocks = document.querySelectorAll('.highlight')
    if (codeBlocks !== null) {
      codeBlocks.forEach(item => {
        if (item.getAttribute('code-find') === null) {
          try {
            if (!item.classList.contains('mermaid') && item.querySelector('.code-header') === null) {
              if (item.querySelector('.mermaid') !== null) {
                this.doAsMermaid(item)
              } else {
                this.doAsCode(item)
              }
            }
          } catch (e) {
            return
          }
          item.setAttribute('code-find', '')
        }
      })
    }
    mermaid.init()
    this.clearMermaid()
  }

  constructor() {
    this.findCode()
  }
}

let code = new Code()

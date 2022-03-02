import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import 'leader-line';
import { Subject } from 'rxjs';

declare let LeaderLine: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'simple-flowy';

  lines: any[] = [];
  nodes: Node[] = [];
  stickyPoint!: HTMLElement | null;
  mat_cards: Element[] = [];
  connectMode: boolean = false;
  line: any;
  refNode!: HTMLElement | null;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    //Initial Nodes

    this.nodes = [
      {
        id: 'first_node',
        text: 'First Node',
      },
      {
        id: 'second_node',
        text: 'Second Node',
      },
      {
        id: 'third_node',
        text: 'Third Node',
      },
      {
        id: 'fourth_node',
        text: 'Fourth Node',
      },
    ];
  }

  ngAfterViewInit() {
    this.drawLines();

    this.mat_cards = Array.from(document.querySelectorAll('.card-box'));
    this.stickyPoint = document.getElementById('sticky-point');
  }

  drawLines() {
    for (let i = 0; i < this.nodes.length - 1; i++) {
      let start_point = document.getElementById(this.nodes[i].id);
      let end_point = document.getElementById(this.nodes[i + 1].id);
      let line = this.CreateLeaderLine(start_point, end_point);
      let node_id = this.nodes[i].id + '_' + this.nodes[i + 1].id;
      this.lines.push({ nodeid: node_id, data: line });
    }

    console.log(this.lines);
  }

  dragStarted(e: any) {
    // Reposition all the drawn lines
    this.redrawLines();
  }

  redrawLines() {
    this.lines.forEach((line) => {
      line.data.position();
    });
  }

  createNode(refNode: any) {
    let node_id = 'dn_' + (this.nodes.length + 1);
    let node_text = 'Dynamic Node Coming From ' + refNode;
    this.nodes.push({ id: node_id, text: node_text });

    const div = document.querySelector('#div_boundary');

    // Observe the DOM for our newly created Element
    const obsrvr = new MutationObserver((m, o) => {
      let start_point = document.getElementById(refNode);
      let end_point = document.getElementById(node_id);
      let line = this.CreateLeaderLine(start_point, end_point);

      this.lines.push({ nodeid: refNode + '_' + node_id, data: line });
      this.mat_cards = Array.from(document.querySelectorAll('.card-box'));
      o.disconnect();
    });

    if (div) {
      obsrvr.observe(div, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }
  }

  CreateLeaderLine(
    start_point: any,
    end_point: any,
    isDash = false,
    isDashAnim = false
  ): typeof LeaderLine {
    let primaryColor = 'rgba(6, 78, 59, 1)';
    let animateDash = isDashAnim;

    let ll_options = {
      start: start_point,
      end: end_point,
      ...(isDash && { dash: { animation: animateDash } }),
      path: 'fluid',
      startPlug: 'disc',
      endPlug: 'arrow1',
      color: primaryColor,
      size: 3,
      startPlugColor: primaryColor,
      startPlugOutline: true,
      startPlugOutlineColor: primaryColor,
      startPlugSize: 1.5,
      endPlugColor: primaryColor,
      endPlugOutline: true,
      endPlugOutlineColor: primaryColor,
      endPlugSize: 1.5,
      startLabel: 'START',
      middleLabel: 'MIDDLE',
      endLabel: 'END',
    };

    return new LeaderLine(ll_options);
  }

  connectNode(refNode: any, event: Event) {
    let start_point = document.getElementById(refNode);
    this.refNode = start_point;
    if (this.connectMode) {
      // if clicked again on the button then Abort
      this.line?.remove();

      if (this.stickyPoint) this.stickyPoint.style.display = 'none';
      this.connectMode = false;
    } else if ((event.target as HTMLElement).parentElement === start_point) {
      // Start
      if (this.stickyPoint) {
        this.stickyPoint.style.display = 'block';

        //hook up our line with the sticky element so line can be moved
        this.line = this.CreateLeaderLine(
          start_point,
          this.stickyPoint,
          true,
          true
        );
      }
      this.connectMode = true;
      this.updateLine(event);
    }
    document.addEventListener('mousemove', (event) => {
      if (this.connectMode) {
        this.updateLine(event);
      }
    });
  }

  updateLine(event: any) {
    if (this.stickyPoint && this.line) {
      this.stickyPoint.style.left = `${event.clientX + scrollX}px`;
      this.stickyPoint.style.top = `${event.clientY + scrollY}px`;
      this.line.position();
    }
  }

  ConnectRefNode(e: Event) {
    let el = e.target as HTMLElement;
    debugger;
    if (el && el.tagName === 'MAT-CARD' && el != this.refNode) {
      const targetNode = this.mat_cards.find((elm) => elm === el);
      const nodeid = this.refNode?.id + '_' + el.id;

      if (targetNode && this.line) {
        if (!this.lines.some((l) => l.nodeid == nodeid)) {
          this.line.setOptions({
            end: targetNode,
            dash: false,
          });

          this.lines.push({
            nodeid: nodeid,
            data: this.line,
          });
        } else {
          this.line.remove();
          alert('already connected');
        }

        this.document.removeEventListener('mousemove', (e) =>
          this.updateLine(e)
        );

        this.line = undefined;
        this.refNode = null;
        this.connectMode = false;
      }
    }
  }
}

export class Node {
  id!: string;
  text!: string;
}

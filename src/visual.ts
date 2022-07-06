"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISelectionId = powerbi.visuals.ISelectionId;

import { VisualSettings } from "./settings";
export class Visual implements IVisual {
  private target: HTMLElement;
  private updateCount: number;
  private settings: VisualSettings;
  private textNode: Text;
  private host: IVisualHost;
  private selectionManager: ISelectionManager;
  private rowLevels: powerbi.DataViewHierarchyLevel[];
  private counter: number[];

  constructor(options: VisualConstructorOptions) {
    console.log("Visual constructor", options);
    this.host = options.host;
    this.selectionManager = this.host.createSelectionManager();
    this.target = options.element;
    this.updateCount = 0;
    if (document) {
      const new_p: HTMLElement = document.createElement("p");
      new_p.appendChild(document.createTextNode("Update count:"));
      const new_em: HTMLElement = document.createElement("em");
      this.textNode = document.createTextNode(this.updateCount.toString());

      new_em.appendChild(this.textNode);
      new_p.appendChild(new_em);
      this.target.appendChild(new_p);
    }
  }

  public update(options: VisualUpdateOptions) {
    this.counter = [0, 0, 0, 0];
    this.settings = Visual.parseSettings(
      options && options.dataViews && options.dataViews[0]
    );
    this.EMPTY_ELEMENT(this.target);
    
    console.log("matrix");
    console.info(options.dataViews[0].matrix);
    console.log("data: ",options.dataViews[0].matrix.rows.root.children[0]);
    
    this.rowLevels = options.dataViews[0].matrix.rows.levels;

    options.dataViews[0].matrix.rows.root.children.forEach((child) => {
      this.buildNode(child, []);
    });
  }

  private EMPTY_ELEMENT(element: HTMLElement) {
    while (element.hasChildNodes()) {
      element.removeChild(element.lastChild);
    }
  }

  private buildNode(
    node: powerbi.DataViewMatrixNode,
    parents: powerbi.DataViewMatrixNode[]
  ) {
    if (!node.isSubtotal) {
      this.counter[node.level] += 1;
      let nodeSelectionBuilder: ISelectionIdBuilder =
        this.host.createSelectionIdBuilder();
      parents.push(node);
      for (let i = 0; i < parents.length; i++) {
        nodeSelectionBuilder = nodeSelectionBuilder.withMatrixNode(
          parents[i],
          this.rowLevels
        );
      }
      const nodeSelectionId = nodeSelectionBuilder.createSelectionId();
      const x = document.createElement("BUTTON");
      const t = document.createTextNode(<string>node.value);
      x.appendChild(t);
      x.addEventListener("click", () => {
        this.selectionManager.toggleExpandCollapse(nodeSelectionId);
        console.log(nodeSelectionId, "clicked", node.value);
      });
      this.target.appendChild(x);
      if (node.children)
        node.children.forEach((child) => this.buildNode(child, [node]));
    }
  }

  private static parseSettings(dataView: DataView): VisualSettings {
    return <VisualSettings>VisualSettings.parse(dataView);
  }

  /**
   * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
   * objects and properties you want to expose to the users in the property pane.
   *
   */
  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    return VisualSettings.enumerateObjectInstances(
      this.settings || VisualSettings.getDefault(),
      options
    );
  }
}

/* 
country(100), state(1000), city (10000)

no collapse
100, 0, 0
100, 1000, 0
10, 100, 1000

with collapse
100, 0, 0
1, 10, 0
1, 1, 10

Inference - Same Window only


,
    "expandCollapse": {
        "roles": ["category"],
        "addDataViewFlags": {
            "defaultValue": true
        }
    },
    "drilldown": {
        "roles": ["category"]
    }
*/

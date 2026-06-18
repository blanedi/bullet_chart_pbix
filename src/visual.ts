"use strict";

import powerbi from "powerbi-visuals-api";
import { select as d3Select, Selection } from "d3-selection";
import { scaleLinear } from "d3-scale";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import DataViewCategorical = powerbi.DataViewCategorical;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettings } from "./settings";

interface BulletDatum {
    category: string;
    value: number;
    target: number;
    poor: number;
    satisfactory: number;
    maximum: number;
    selectionId: ISelectionId;
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private svg: Selection<SVGSVGElement, unknown, null, undefined>;
    private container: Selection<SVGGElement, unknown, null, undefined>;
    private selectionManager: ISelectionManager;
    private formattingSettingsService: FormattingSettingsService;
    private settings: VisualSettings;
    private tooltipService: powerbi.extensibility.ITooltipService;
    private events: powerbi.extensibility.IVisualEventService;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.tooltipService = this.host.tooltipService;
        this.events = this.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();

        this.svg = d3Select(options.element)
            .append("svg")
            .classed("bulletChart", true);
        this.container = this.svg.append("g").classed("plotArea", true);

        // Clear selection on empty-space click
        this.svg.on("click", () => {
            this.selectionManager.clear();
            this.container.selectAll(".valueBar").attr("opacity", 1);
        });
    }

    private getColumnByRole(cat: DataViewCategorical, role: string): number[] | null {
        if (!cat || !cat.values) return null;
        for (const col of cat.values) {
            if (col.source.roles && col.source.roles[role]) {
                return col.values.map(v => (v === null || v === undefined ? NaN : Number(v)));
            }
        }
        return null;
    }

    private transform(dataView: DataView): BulletDatum[] {
        const cat = dataView && dataView.categorical;
        if (!cat || !cat.categories || cat.categories.length === 0) return [];

        const category = cat.categories[0];
        const labels = category.values;

        const values = this.getColumnByRole(cat, "value") || [];
        const targets = this.getColumnByRole(cat, "target") || [];
        const poors = this.getColumnByRole(cat, "poor");
        const sats = this.getColumnByRole(cat, "satisfactory");
        const maxes = this.getColumnByRole(cat, "maximum");

        const b = this.settings.bands;
        const usePercent = (b.mode.value.value as string) === "percent" || !poors;

        const out: BulletDatum[] = [];
        for (let i = 0; i < labels.length; i++) {
            const value = isNaN(values[i]) ? 0 : values[i];
            const target = isNaN(targets[i]) ? 0 : targets[i];

            let poor: number, satisfactory: number, maximum: number;
            if (usePercent) {
                poor = target * (b.poorPct.value / 100);
                satisfactory = target * (b.satisfactoryPct.value / 100);
                maximum = target * (b.maxPct.value / 100);
            } else {
                poor = poors && !isNaN(poors[i]) ? poors[i] : target * 0.6;
                satisfactory = sats && !isNaN(sats[i]) ? sats[i] : target * 0.85;
                maximum = maxes && !isNaN(maxes[i]) ? maxes[i] : target * 1.2;
            }
            // Make sure the scale always contains value & target
            maximum = Math.max(maximum, value, target, satisfactory, poor, 1);

            const selectionId = this.host.createSelectionIdBuilder()
                .withCategory(category, i)
                .createSelectionId();

            out.push({
                category: labels[i] === null ? "(blank)" : String(labels[i]),
                value, target, poor, satisfactory, maximum, selectionId
            });
        }
        return out;
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);
        try {
            const dataView = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(
                VisualSettings, dataView
            );

            const data = this.transform(dataView);
            const width = options.viewport.width;
            const height = options.viewport.height;

            this.svg.attr("width", width).attr("height", height);
            this.container.selectAll("*").remove();

            if (data.length === 0) return;

            const s = this.settings;
            const showCatLabels = s.categoryLabels.show.value;
            const showValLabels = s.valueLabels.show.value;
            const showTgtLabels = s.targetLabels.show.value;

            // Layout. Right margin is reserved for target labels that drop to the
            // far-right edge when the value has NOT passed the target.
            const labelWidth = showCatLabels ? Math.min(160, Math.max(70, width * 0.22)) : 8;
            const rightLabelWidth = showTgtLabels ? 50 : 10;
            const padX = 10;
            const plotLeft = labelWidth + padX;
            const plotRight = width - rightLabelWidth - padX;
            const plotWidth = Math.max(10, plotRight - plotLeft);

            const rowPad = 8;
            const rowH = Math.max(14, (height - rowPad) / data.length - rowPad);
            const barH = rowH * (s.valueBar.thickness.value / 100);

            data.forEach((d, i) => {
                const top = rowPad + i * (rowH + rowPad);
                const cy = top + rowH / 2;

                const x = scaleLinear().domain([0, d.maximum]).range([0, plotWidth]);
                const row = this.container.append("g")
                    .attr("transform", `translate(${plotLeft},${top})`);

                // Qualitative bands (drawn back to front)
                const bands = [
                    { end: d.maximum, color: s.bands.goodColor.value.value },
                    { end: d.satisfactory, color: s.bands.satisfactoryColor.value.value },
                    { end: d.poor, color: s.bands.poorColor.value.value }
                ];
                bands.forEach(band => {
                    row.append("rect")
                        .attr("x", 0).attr("y", 0)
                        .attr("width", Math.max(0, x(band.end)))
                        .attr("height", rowH)
                        .attr("fill", band.color);
                });

                // Value bar
                const bar = row.append("rect")
                    .classed("valueBar", true)
                    .attr("x", 0)
                    .attr("y", (rowH - barH) / 2)
                    .attr("width", Math.max(0, x(d.value)))
                    .attr("height", barH)
                    .attr("rx", Math.min(barH / 2, 4))
                    .attr("fill", s.valueBar.fill.value.value)
                    .attr("opacity", 1)
                    .style("cursor", "pointer");

                // Target marker
                if (d.target > 0) {
                    const tx = x(d.target);
                    row.append("line")
                        .attr("x1", tx).attr("x2", tx)
                        .attr("y1", rowH * 0.15).attr("y2", rowH * 0.85)
                        .attr("stroke", s.target.fill.value.value)
                        .attr("stroke-width", s.target.strokeWidth.value)
                        .attr("stroke-linecap", "round");
                }

                // Category label
                if (showCatLabels) {
                    this.container.append("text")
                        .attr("x", labelWidth)
                        .attr("y", cy)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "end")
                        .attr("fill", s.categoryLabels.fontColor.value.value)
                        .style("font-size", `${s.categoryLabels.fontSize.value}px`)
                        .style("font-family", "Segoe UI, sans-serif")
                        .text(d.category)
                        .append("title").text(d.category);
                }

                // Value label: sits at the end of the dark value bar.
                // Inside the bar (auto-contrast text) when it fits, else just outside the tip.
                if (showValLabels) {
                    const barW = Math.max(0, x(d.value));
                    const vfs = s.valueLabels.fontSize.value;
                    const vLabel = row.append("text")
                        .attr("y", rowH / 2)
                        .attr("dy", "0.35em")
                        .style("font-size", `${vfs}px`)
                        .style("font-weight", "600")
                        .style("font-family", "Segoe UI, sans-serif")
                        .text(this.fmt(d.value));
                    const tw = (vLabel.node() as SVGTextElement).getComputedTextLength();
                    if (barW >= tw + 12 && barH >= vfs) {
                        // inside, right-aligned at the bar tip
                        vLabel.attr("x", barW - 6)
                            .attr("text-anchor", "end")
                            .attr("fill", this.contrast(s.valueBar.fill.value.value));
                    } else {
                        // outside, just past the tip
                        vLabel.attr("x", barW + 6)
                            .attr("text-anchor", "start")
                            .attr("fill", s.valueLabels.fontColor.value.value);
                    }
                }

                // Target callout: shows the target value.
                //  - value HAS passed target -> pill riding at the marker line
                //  - value has NOT passed   -> dropped to the far-right edge
                if (showTgtLabels && d.target > 0) {
                    const tfs = s.targetLabels.fontSize.value;
                    const tcolor = s.targetLabels.fontColor.value.value;
                    const tx = x(d.target);
                    const passed = d.value >= d.target;

                    if (passed) {
                        const g = row.append("g");
                        const txt = g.append("text")
                            .attr("y", rowH / 2)
                            .attr("dy", "0.35em")
                            .attr("text-anchor", "start")
                            .style("font-size", `${tfs}px`)
                            .style("font-weight", "600")
                            .style("font-family", "Segoe UI, sans-serif")
                            .attr("fill", tcolor)
                            .text(this.fmt(d.target));
                        const w = (txt.node() as SVGTextElement).getComputedTextLength();
                        const padPx = 4;
                        // place pill just to the right of the marker, clamped inside the plot
                        let px = tx + 5;
                        if (px + w + 2 * padPx > plotWidth + rightLabelWidth) {
                            px = Math.max(0, tx - 5 - w - 2 * padPx); // flip to the left if no room
                        }
                        g.insert("rect", "text")
                            .attr("x", px)
                            .attr("y", rowH / 2 - tfs / 2 - 2)
                            .attr("width", w + 2 * padPx)
                            .attr("height", tfs + 4)
                            .attr("rx", 3)
                            .attr("fill", "#FFFFFF")
                            .attr("fill-opacity", 0.92)
                            .attr("stroke", tcolor)
                            .attr("stroke-width", 0.75);
                        txt.attr("x", px + padPx);
                    } else {
                        // far-right edge, clean column
                        row.append("text")
                            .attr("x", plotWidth + 8)
                            .attr("y", rowH / 2)
                            .attr("dy", "0.35em")
                            .attr("text-anchor", "start")
                            .attr("fill", tcolor)
                            .style("font-size", `${tfs}px`)
                            .style("font-family", "Segoe UI, sans-serif")
                            .text(this.fmt(d.target));
                    }
                }

                // Interactions: selection + tooltip
                bar.on("click", (event: MouseEvent) => {
                    event.stopPropagation();
                    this.selectionManager.select(d.selectionId).then((ids: ISelectionId[]) => {
                        const has = ids.length > 0;
                        this.container.selectAll(".valueBar").attr("opacity", has ? 0.35 : 1);
                        d3Select(event.currentTarget as Element).attr("opacity", 1);
                    });
                });

                const tooltipItems: VisualTooltipDataItem[] = [
                    { displayName: "Category", value: d.category },
                    { displayName: "Value", value: this.fmt(d.value) },
                    { displayName: "Target", value: this.fmt(d.target) },
                    { displayName: "vs Target", value: d.target ? `${((d.value / d.target) * 100).toFixed(1)}%` : "n/a" }
                ];
                bar.on("mousemove", (event: MouseEvent) => {
                    this.tooltipService.show({
                        dataItems: tooltipItems,
                        identities: [d.selectionId],
                        coordinates: [event.clientX, event.clientY],
                        isTouchEvent: false
                    });
                });
                bar.on("mouseout", () => {
                    this.tooltipService.hide({ immediately: true, isTouchEvent: false });
                });

                // Right-click context menu (drill / filter actions)
                bar.on("contextmenu", (event: MouseEvent) => {
                    event.preventDefault();
                    this.selectionManager.showContextMenu(d.selectionId, {
                        x: event.clientX,
                        y: event.clientY
                    });
                });
            });
        } finally {
            this.events.renderingFinished(options);
        }
    }

    /** Pick black or white text for legibility on a given background colour. */
    private contrast(hex: string): string {
        const c = (hex || "").replace("#", "");
        if (c.length < 6) return "#FFFFFF";
        const r = parseInt(c.substr(0, 2), 16);
        const g = parseInt(c.substr(2, 2), 16);
        const b = parseInt(c.substr(4, 2), 16);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.6 ? "#1A202C" : "#FFFFFF";
    }

    private fmt(n: number): string {
        if (n === null || n === undefined || isNaN(n)) return "—";
        const abs = Math.abs(n);
        if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
        if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
        return Number.isInteger(n) ? String(n) : n.toFixed(2);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }
}

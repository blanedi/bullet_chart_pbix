# Bullet Chart Power BI

A Power BI **custom visual** — a Stephen Few style bullet chart: a value bar
measured against a target marker over qualitative bands (poor / satisfactory /
good). Built with TypeScript + D3 on the Power BI Visuals API (v5.3).

![bullet chart](assets/icon.png)

## Install in Power BI

You don't need to build anything to use it. Grab the packaged visual and import it:

1. Download `release/BulletChart-ICMPD-v1.1.0.pbiviz`.
2. In Power BI Desktop, open the **Visualizations** pane → `···` →
   **Import a visual from a file**.
3. Select the `.pbiviz`. It appears as **Bullet Chart**.

## Field wells

| Well | Required | Purpose |
|------|----------|---------|
| **Category** | yes | One bar per row (wilaya, indicator, project, …) |
| **Value** | yes | The actual measured value (the bar) |
| **Target** | yes | Comparison target (the marker line) |
| **Poor (max)** | optional | Upper bound of the *poor* band |
| **Satisfactory (max)** | optional | Upper bound of the *satisfactory* band |
| **Maximum (scale)** | optional | End of the axis / *good* band |

## Bands: two modes

In **Format → Qualitative bands → Band source**:

- **Percent of target** (default) — set poor / satisfactory / scale-max as a
  percentage of the target, so no extra measures are needed.
- **From measures** — drives the bands off the optional Poor / Satisfactory /
  Maximum fields when you have explicit thresholds.

## Labels

- **Value label** sits at the end of the value bar — inside it (auto-contrast
  text) when it fits, just outside the tip when the bar is short.
- **Target label** is adaptive: a pill at the marker when the value has passed
  the target, otherwise dropped to the far-right edge.

Both, plus bar / marker / band colours, thickness and text sizes, are
configurable in the Format pane.

## Other behaviour

Native tooltips (value, target, % vs target), click-to-cross-filter,
right-click context menu, and per-row auto-scaling.

## Build from source

Requires Node.js and the Power BI Visuals Tools.

```bash
npm install -g powerbi-visuals-tools   # provides the `pbiviz` CLI
npm install                            # install project dependencies
pbiviz package                         # outputs dist/*.pbiviz
```

`pbiviz start` runs the live dev server against Power BI Service for debugging.

## Project layout

```
src/visual.ts        rendering engine (D3)
src/settings.ts      Format-pane model (formatting-model utils)
capabilities.json    data roles + formatting objects
pbiviz.json          visual metadata
style/visual.less    styles
release/             packaged .pbiviz for download
```

## License

MIT — see [LICENSE](LICENSE).

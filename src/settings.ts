"use strict";

import powerbi from "powerbi-visuals-api";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/** Value bar appearance */
class ValueBarCard extends FormattingSettingsCard {
    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Bar colour",
        value: { value: "#2B6CB0" }
    });

    thickness = new formattingSettings.NumUpDown({
        name: "thickness",
        displayName: "Bar thickness (%)",
        value: 36,
        options: {
            minValue: { value: 8, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 90, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    name: string = "valueBar";
    displayName: string = "Value bar";
    slices: Array<FormattingSettingsSlice> = [this.fill, this.thickness];
}

/** Target marker appearance */
class TargetCard extends FormattingSettingsCard {
    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Marker colour",
        value: { value: "#1A202C" }
    });

    strokeWidth = new formattingSettings.NumUpDown({
        name: "strokeWidth",
        displayName: "Marker width (px)",
        value: 3,
        options: {
            minValue: { value: 1, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 10, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    name: string = "target";
    displayName: string = "Target marker";
    slices: Array<FormattingSettingsSlice> = [this.fill, this.strokeWidth];
}

/** Qualitative bands */
class BandsCard extends FormattingSettingsCard {
    mode = new formattingSettings.ItemDropdown({
        name: "mode",
        displayName: "Band source",
        items: [
            { displayName: "Percent of target", value: "percent" },
            { displayName: "From measures", value: "measures" }
        ],
        value: { displayName: "Percent of target", value: "percent" }
    });

    poorPct = new formattingSettings.NumUpDown({
        name: "poorPct",
        displayName: "Poor up to (% of target)",
        value: 60,
        options: {
            minValue: { value: 1, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 300, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    satisfactoryPct = new formattingSettings.NumUpDown({
        name: "satisfactoryPct",
        displayName: "Satisfactory up to (% of target)",
        value: 85,
        options: {
            minValue: { value: 1, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 300, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    maxPct = new formattingSettings.NumUpDown({
        name: "maxPct",
        displayName: "Scale maximum (% of target)",
        value: 120,
        options: {
            minValue: { value: 1, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 500, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    poorColor = new formattingSettings.ColorPicker({
        name: "poorColor",
        displayName: "Poor band",
        value: { value: "#D9D9D9" }
    });

    satisfactoryColor = new formattingSettings.ColorPicker({
        name: "satisfactoryColor",
        displayName: "Satisfactory band",
        value: { value: "#ECECEC" }
    });

    goodColor = new formattingSettings.ColorPicker({
        name: "goodColor",
        displayName: "Good band",
        value: { value: "#F7F7F7" }
    });

    name: string = "bands";
    displayName: string = "Qualitative bands";
    slices: Array<FormattingSettingsSlice> = [
        this.mode, this.poorPct, this.satisfactoryPct, this.maxPct,
        this.poorColor, this.satisfactoryColor, this.goodColor
    ];
}

/** Category (row) labels */
class CategoryLabelsCard extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true
    });
    topLevelSlice: formattingSettings.ToggleSwitch = this.show;

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Colour",
        value: { value: "#1A202C" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 11,
        options: {
            minValue: { value: 6, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 30, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    name: string = "categoryLabels";
    displayName: string = "Category labels";
    slices: Array<FormattingSettingsSlice> = [this.fontColor, this.fontSize];
}

/** Value labels */
class ValueLabelsCard extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true
    });
    topLevelSlice: formattingSettings.ToggleSwitch = this.show;

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Colour",
        value: { value: "#4A5568" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 11,
        options: {
            minValue: { value: 6, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 30, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    name: string = "valueLabels";
    displayName: string = "Value labels";
    slices: Array<FormattingSettingsSlice> = [this.fontColor, this.fontSize];
}

/** Target labels */
class TargetLabelsCard extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true
    });
    topLevelSlice: formattingSettings.ToggleSwitch = this.show;

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Colour",
        value: { value: "#C53030" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 11,
        options: {
            minValue: { value: 6, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 30, type: powerbi.visuals.ValidatorType.Max }
        }
    });

    name: string = "targetLabels";
    displayName: string = "Target labels";
    slices: Array<FormattingSettingsSlice> = [this.fontColor, this.fontSize];
}

/** Root model */
export class VisualSettings extends FormattingSettingsModel {
    valueBar = new ValueBarCard();
    target = new TargetCard();
    bands = new BandsCard();
    categoryLabels = new CategoryLabelsCard();
    valueLabels = new ValueLabelsCard();
    targetLabels = new TargetLabelsCard();

    cards: Array<FormattingSettingsCard> = [
        this.valueBar, this.target, this.bands, this.categoryLabels, this.valueLabels, this.targetLabels
    ];
}

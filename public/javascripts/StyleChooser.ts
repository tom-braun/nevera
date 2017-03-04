/**
 * Created by tom on 25.02.17.
 */


class StyleChooser {
    private selectedStyle = undefined;

    constructor(private stylesId : string) {
        $(this.stylesId + " span").on('click', (e : JQueryKeyEventObject) => {
            this.setSelectedStyle(e.target.id);
        });
        this.setSelectedStyle('event');
    }

    public getSelectedStyle() {
        return this.selectedStyle;
    }

    private setSelectedStyle(style : string) {
        $(this.stylesId + " span").removeClass("selected-style");
        console.log("targetId: ", style);
        $("#"+style).addClass("selected-style");
        this.selectedStyle = style;
    }
}


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
        $(this.stylesId + " span").css({ border : 'none'});
        console.log("targetId: ", style);
        $("#"+style).css({ border : '2px solid black' });
        this.selectedStyle = style;
    }
}


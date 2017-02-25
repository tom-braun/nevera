/**
 * Created by tom on 25.02.17.
 */
var StyleChooser = (function () {
    function StyleChooser(stylesId) {
        var _this = this;
        this.stylesId = stylesId;
        this.selectedStyle = undefined;
        $(this.stylesId + " span").on('click', function (e) {
            _this.setSelectedStyle(e.target.id);
        });
        this.setSelectedStyle('event');
    }
    StyleChooser.prototype.getSelectedStyle = function () {
        return this.selectedStyle;
    };
    StyleChooser.prototype.setSelectedStyle = function (style) {
        $(this.stylesId + " span").css({ border: 'none' });
        console.log("targetId: ", style);
        $("#" + style).css({ border: '2px solid black' });
        this.selectedStyle = style;
    };
    return StyleChooser;
}());
//# sourceMappingURL=StyleChooser.js.map
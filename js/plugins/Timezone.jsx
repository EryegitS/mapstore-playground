import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {createPlugin} from "@mapstore/utils/PluginsUtils";
import {Glyphicon} from "react-bootstrap";
import {toggleControl} from "@mapstore/actions/controls";
import Dialog from '@mapstore/components/misc/Dialog';
import ts from '@mapbox/timespace';

class TimeZoneComponent extends React.Component {
    static propTypes = {
        mapCenter: PropTypes.any,
        onClose: PropTypes.func,
        enabled: PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = {
            time: new Date()
        };
    }

    componentDidMount() {
        this.intervalID = setInterval(
            () => {
                this.setState({
                    date: new Date()
                });
            },
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    render() {
        let time;
        let offset;
        let point;
        let timezone = "Timezone could not be determined.";
        if (this.props.mapCenter) {
            point = [this.props.mapCenter.x.toFixed(6), this.props.mapCenter.y.toFixed(6)];
            // Using @mapbox/timespace to detirmine timezone from latitude and longitude
            time = ts.getFuzzyLocalTimeFromPoint(this.state.date, point);
            if (time) {
                timezone = time.toISOString(true) !== null ? time.toISOString(true).split('.')[0] + "Z " : timezone;
                offset = time.utcOffset() / 60;
                // timespace package couldn't provide exact format that we want. So I made some costumization.
                timezone = time.utcOffset() ? timezone + "GMT" + (offset >= 0 ? "+" + offset : offset) : timezone;
                timezone = time._z.name ? timezone + " " + time._z.name : timezone;
            } else { // @mapbox/timespace package couldn't provide timezones for all latitude and longitude values.
                // For example oceans not included the package. But they can be included. Please check: https://github.com/mapbox/timespace
                // The timezone calculated from latitude in this code block as you mention in issue description.
                const x = this.props.mapCenter.x % 15;
                let y = Math.trunc(this.props.mapCenter.x / 15);
                if (x > 7.500) {
                    y++;
                } else if (x < -7.500) {
                    y--;
                }
                const z = new Date(new Date().getTime() + y * 3600 * 1000).toISOString().split('.')[0] + "Z" + " GMT" + (y >= 0 ? "+" + y : y);
                timezone = typeof z === "string" ? z : timezone;
            }
        }
        return <Dialog
            style={{zIndex: 1992, display: this.props.enabled ? "block" : "none"}}
            modal={false}
            draggable={true}>
            <span role="header">
                <span className="settings-panel-title">Time zone</span>
                <button onClick={this.props.onClose} className="settings-panel-close close"><Glyphicon glyph="1-close"/></button>
            </span>
            <div role="body">
                {timezone}
            </div>
        </Dialog>;
    }
}

const ConnectedTimeZone = connect((state) => ({
    enabled: state.controls && state.controls.timeZone && state.controls.timeZone.enabled || false,
    withButton: false,
    mapCenter: get(state, 'map.present.center')
}), {
    onClose: toggleControl.bind(null, 'timeZone', null)
})(TimeZoneComponent);

export default createPlugin("TimeZone", {
    containers: {
        BurgerMenu: {
            name: 'timezone',
            position: 1501,
            text: "Time Zone",
            icon: <Glyphicon glyph="time"/>,
            action: toggleControl.bind(null, 'timeZone', null),
            priority: 1,
            doNotHide: true
        }
    },
    component: ConnectedTimeZone
});

import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './Options.css';
import Option from 'components/Option';
import SlidersContainer from 'containers/Sliders';
import { withSubscribe } from 'rlib/utils';

const SLIDERS_STATE_KEY = 'slidersContainer';

const decorateWithIndex = (func, index) => () => {
    func(index);
}

const Options = (props) => (
    <div className={classnames(styles.wrapper)}>
        {
            props[SLIDERS_STATE_KEY].state.sliders.map((slider, index) => (
                <Option
                    key={index}
                    name={slider.name}
                    isChecked={slider.value}
                    onChange={decorateWithIndex(
                        props[SLIDERS_STATE_KEY].toggleSlider,
                        index
                    )}
                />
            ))
        }
    </div>
);

Options.propTypes = {
    [SLIDERS_STATE_KEY]: PropTypes.shape({
        state: PropTypes.shape({
            sliders: PropTypes.array
        }),
        toggleSlider: PropTypes.func
    })
};

export default withSubscribe([
    {
        name: SLIDERS_STATE_KEY,
        container: SlidersContainer
    }
], Options);
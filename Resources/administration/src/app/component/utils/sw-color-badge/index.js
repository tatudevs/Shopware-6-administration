import template from './sw-color-badge.html.twig';
import './sw-color-badge.less';

/**
 * @public
 * @description
 * Renders a colored badge for example as indicator if an item is available.
 * @status ready
 * @example-type static
 * @component-example
 * <div>
 *     <!-- red square -->
 *     <sw-color-badge color="red"></sw-color-badge>
 *     <!-- green square -->
 *     <sw-color-badge color="green"></sw-color-badge>
 *     <!-- red circle -->
 *     <sw-color-badge color="red" rounded></sw-color-badge>
 * </div>
 */
export default {
    name: 'sw-color-badge',
    template,

    props: {
        variant: {
            type: String,
            required: false,
            default: 'default'
        },
        color: {
            type: String,
            required: false,
            default: ''
        },
        rounded: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    computed: {
        colorStyle() {
            if (!this.color.length) {
                return '';
            }
            return `background:${this.color}`;
        },
        variantClass() {
            return {
                [`is--${this.variant}`]: true,
                'is--rounded': this.rounded
            };
        }
    }
};

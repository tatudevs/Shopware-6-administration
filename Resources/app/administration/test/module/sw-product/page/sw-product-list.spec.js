import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import 'src/module/sw-product/page/sw-product-list';
import 'src/app/component/data-grid/sw-data-grid';
import 'src/app/component/data-grid/sw-data-grid-settings';
import 'src/app/component/entity/sw-entity-listing';
import 'src/app/component/context-menu/sw-context-button';
import 'src/app/component/context-menu/sw-context-menu-item';
import 'src/app/component/base/sw-button';
import 'src/app/component/grid/sw-pagination';
import 'src/app/component/base/sw-empty-state';
import 'src/app/component/structure/sw-page';

const CURRENCY_ID = {
    EURO: 'b7d2554b0ce847cd82f3ac9bd1c0dfca',
    POUND: 'fce3465831e8639bb2ea165d0fcf1e8b'
};

function mockContext() {
    return {
        apiPath: 'http://shopware.local/api',
        apiResourcePath: 'http://shopware.local/api/v2',
        apiVersion: 2,
        assetsPath: 'http://shopware.local/bundles/',
        basePath: '',
        host: 'shopware.local',
        inheritance: false,
        installationPath: 'http://shopware.local',
        languageId: '2fbb5fe2e29a4d70aa5854ce7ce3e20b',
        liveVersionId: '0fa91ce3e96a4bc2be4bd9ce752c3425',
        pathInfo: '/admin',
        port: 80,
        scheme: 'http',
        schemeAndHttpHost: 'http://shopware.local',
        uri: 'http://shopware.local/admin'
    };
}

function mockPrices() {
    return [
        {
            currencyId: CURRENCY_ID.POUND,
            net: 373.83,
            gross: 400,
            linked: true
        },
        {
            currencyId: CURRENCY_ID.EURO,
            net: 560.75,
            gross: 600,
            linked: true
        }
    ];
}

function mockCriteria() {
    return {
        limit: 25,
        page: 1,
        sortings: [],
        resetSorting() {
            this.sortings = [];
        },
        addSorting(sorting) {
            this.sortings.push(sorting);
        }
    };
}

function getProductData(criteria) {
    const products = [
        {
            active: true,
            stock: 333,
            availableStock: 333,
            available: true,
            price: [
                {
                    currencyId: CURRENCY_ID.POUND,
                    net: 373.83,
                    gross: 400,
                    linked: true
                },
                {
                    currencyId: CURRENCY_ID.EURO,
                    net: 560.75,
                    gross: 600,
                    linked: true
                }
            ],
            productNumber: 'SW10001',
            name: 'Product 2',
            id: 'dcc37f845b664e24b5b2e6e77c078e6c'
        },
        {
            active: true,
            stock: 333,
            availableStock: 333,
            available: true,
            price: [
                {
                    currencyId: CURRENCY_ID.POUND,
                    net: 20.56,
                    gross: 22,
                    linked: true
                },
                {
                    currencyId: CURRENCY_ID.EURO,
                    net: 186.89,
                    gross: 200,
                    linked: true
                }
            ],
            productNumber: 'SW10000',
            name: 'Product 1',
            id: 'bc5ff49955be4b919053add552c2815d',
            childCount: 8
        }
    ];

    // check if grid is sorting for currency
    const sortingForCurrency = criteria.sortings.some(sortAttr => sortAttr.field.startsWith('price'));

    if (sortingForCurrency) {
        const sortBy = criteria.sortings[0].field;
        const sortDirection = criteria.sortings[0].order;

        products.sort((productA, productB) => {
            const currencyId = sortBy.split('.')[1];

            const currencyValueA = productA.price.find(price => price.currencyId === currencyId).gross;
            const currencyValueB = productB.price.find(price => price.currencyId === currencyId).gross;

            if (sortDirection === 'DESC') {
                return currencyValueB - currencyValueA;
            }

            return currencyValueA - currencyValueB;
        });
    }

    products.sortings = [];
    products.total = products.length;
    products.criteria = mockCriteria();
    products.context = mockContext();

    return products;
}

function getCurrencyData() {
    return [
        {
            factor: 1,
            symbol: '€',
            isoCode: 'EUR',
            shortName: 'EUR',
            name: 'Euro',
            decimalPrecision: 2,
            position: 1,
            isSystemDefault: true,
            id: CURRENCY_ID.EURO
        },
        {
            factor: 1.0457384950,
            symbol: '£',
            isoCode: 'GBP',
            shortName: 'GBP',
            name: 'Pound',
            decimalPrecision: 2,
            position: 1,
            isSystemDefault: true,
            id: CURRENCY_ID.POUND
        }
    ];
}

function createWrapper() {
    const localVue = createLocalVue();
    localVue.use(VueRouter);
    localVue.directive('tooltip', {});
    localVue.filter('currency', (currency) => currency);

    const router = new VueRouter({
        routes: [{
            name: 'sw.product.list',
            path: '/sw/product/list',
            component: Shopware.Component.build('sw-product-list'),
            meta: {
                $module: {
                    entity: 'product'
                }
            }
        }]
    });

    return {
        wrapper: shallowMount(Shopware.Component.build('sw-product-list'), {
            localVue,
            router,
            mocks: {
                $device: { onResize: () => {} },
                $tc: () => {},
                $te: () => {}
            },
            provide: {
                numberRangeService: {},
                feature: {
                    isActive: () => true
                },
                repositoryFactory: {
                    create: (name) => {
                        if (name === 'product') {
                            return { search: (criteria) => {
                                const productData = getProductData(criteria);

                                return Promise.resolve(productData);
                            } };
                        }

                        return { search: () => Promise.resolve(getCurrencyData()) };
                    }
                },
                filterFactory: {
                    create: () => []
                },
                acl: {
                    can: () => true
                }
            },
            stubs: {
                'sw-page': {
                    template: '<div><slot name="content"></slot></div>'
                },
                'sw-entity-listing': Shopware.Component.build('sw-entity-listing'),
                'sw-context-button': {
                    template: '<div></div>'
                },
                'sw-context-menu-item': {
                    template: '<div></div>'
                },
                'sw-data-grid-settings': {
                    template: '<div></div>'
                },
                'sw-empty-state': {
                    template: '<div></div>'
                },
                'sw-pagination': {
                    template: '<div></div>'
                },
                'sw-icon': {
                    template: '<div></div>'
                },
                'sw-button': {
                    template: '<div></div>'
                },
                'sw-sidebar': {
                    template: '<div></div>'
                },
                'sw-sidebar-item': {
                    template: '<div></div>'
                },
                'router-link': {
                    template: '<div></div>'
                },
                'sw-language-switch': {
                    template: '<div></div>'
                },
                'sw-notification-center': {
                    template: '<div></div>'
                },
                'sw-search-bar': {
                    template: '<div></div>'
                },
                'sw-loader': {
                    template: '<div></div>'
                },
                'sw-data-grid-skeleton': {
                    template: '<div class="sw-data-grid-skeleton"></div>'
                },
                'sw-checkbox-field': {
                    template: '<div></div>'
                },
                'sw-media-preview-v2': {
                    template: '<div></div>'
                },
                'sw-color-badge': {
                    template: '<div></div>'
                }
            }
        }),
        router: router
    };
}

describe('module/sw-product/page/sw-product-list', () => {
    let wrapper;
    let router;

    beforeEach(() => {
        wrapper = createWrapper().wrapper;
        router = createWrapper().router;
    });

    afterEach(() => {
        wrapper.destroy();
    });

    it('should be a Vue.JS component', async () => {
        await router.push({
            name: 'sw.product.list'
        });
        expect(wrapper.vm).toBeTruthy();
    });

    it('should sort grid when sorting for price', async () => {
        // load content of grid
        await wrapper.vm.getList();

        // get header which sorts grid when clicking on it
        const currencyColumnHeader = wrapper.find('.sw-data-grid__cell--header.sw-data-grid__cell--4');

        const priceCells = wrapper.findAll('.sw-data-grid__cell--price-EUR');
        const firstPriceCell = priceCells.at(0);
        const secondPriceCell = priceCells.at(1);

        // assert cells have correct values
        expect(firstPriceCell.text()).toBe('600');
        expect(secondPriceCell.text()).toBe('200');

        // sort grid after price ASC
        await currencyColumnHeader.trigger('click');
        await wrapper.vm.$nextTick();

        const sortedPriceCells = wrapper.findAll('.sw-data-grid__cell--price-EUR');
        const firstSortedPriceCell = sortedPriceCells.at(0);
        const secondSortedPriceCell = sortedPriceCells.at(1);

        // assert that order of values has changed
        expect(firstSortedPriceCell.text()).toBe('200');
        expect(secondSortedPriceCell.text()).toBe('600');

        // verify that grid did not crash when sorting for prices
        const skeletonElement = wrapper.find('.sw-data-grid-skeleton');
        expect(skeletonElement.exists()).toBe(false);
    });

    it('should sort products by different currencies', async () => {
        await wrapper.vm.getList();

        // get header which sorts grid when clicking on it
        const currencyColumnHeader = wrapper.find('.sw-data-grid__cell--header.sw-data-grid__cell--4');

        // sort grid after price ASC
        await currencyColumnHeader.trigger('click');
        await wrapper.vm.$nextTick();

        const euroCells = wrapper.findAll('.sw-data-grid__cell--price-EUR');
        const [firstEuroCell, secondEuroCell] = euroCells.wrappers;

        expect(firstEuroCell.text()).toBe('600');
        expect(secondEuroCell.text()).toBe('200');

        const poundCells = wrapper.findAll('.sw-data-grid__cell--price-GBP');
        const [firstPoundCell, secondPoundCell] = poundCells.wrappers;

        expect(firstPoundCell.text()).toBe('400');
        expect(secondPoundCell.text()).toBe('22');

        const columnHeaders = wrapper.findAll('.sw-data-grid__cell.sw-data-grid__cell--header');
        const poundColumn = columnHeaders.at(6);

        await poundColumn.trigger('click');

        await wrapper.vm.$nextTick();

        const sortedPoundCells = wrapper.findAll('.sw-data-grid__cell--price-GBP');
        const [firstSortedPoundCell, secondSortedPoundCell] = sortedPoundCells.wrappers;

        expect(firstSortedPoundCell.text()).toBe('22');
        expect(secondSortedPoundCell.text()).toBe('400');
    });

    it('should return price when given currency id', async () => {
        const currencyId = CURRENCY_ID.EURO;
        const prices = mockPrices();

        const foundPriceData = wrapper.vm.getCurrencyPriceByCurrencyId(currencyId, prices);
        const expectedPriceData = {
            currencyId: CURRENCY_ID.EURO,
            net: 560.75,
            gross: 600,
            linked: true
        };

        expect(foundPriceData).toEqual(expectedPriceData);
    });

    it('should return fallback when no price was found', async () => {
        const currencyId = 'no-valid-id';
        const prices = mockPrices();

        const foundPriceData = wrapper.vm.getCurrencyPriceByCurrencyId(currencyId, prices);
        const expectedPriceData = {
            currencyId: null,
            gross: null,
            linked: true,
            net: null
        };

        expect(foundPriceData).toEqual(expectedPriceData);
    });

    it('should return false if product has no variants', () => {
        const [product] = getProductData(mockCriteria());
        const productHasVariants = wrapper.vm.productHasVariants(product);

        expect(productHasVariants).toBe(false);
    });

    it('should return true if product has variants', () => {
        const [, product] = getProductData(mockCriteria());
        const productHasVariants = wrapper.vm.productHasVariants(product);

        expect(productHasVariants).toBe(true);
    });
});

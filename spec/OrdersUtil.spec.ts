import "jasmine";
import { AccountDiscountClass, AccountOrderClass, DiscountTypeEnum, OrderStatusEnum, OrderTypeEnum, OrdersUtil, TableAccounts } from "../src/OrdersUtil";
import { omit } from "lodash";
import { EventEmitter } from "stream";
import { Injector } from "../src/Injector.class";
import { FakePaymentService } from "../src/testing-tools/fake-payment-service";
import { FakeDBService } from "../src/testing-tools/fake-db-service";

describe('OrdersUtil', () => {
    describe('addOrder', () => {
        it(`Debería agregar órdenes a una mesa y calcular el total y subtotal en múltiplos de 50 centavos.`, () => {
            const tableAccounts: TableAccounts = {
                accounts: [],
                tableId: '1',
                subTotal: 0,
                total: 0
            };
            // step 1
            OrdersUtil.addOrder(tableAccounts, new AccountOrderClass({
                price: 100,
                qty: 1,
                status: OrderStatusEnum.pending,
                type: OrderTypeEnum.dish,
                productId: 'A',
            }));
            expect(tableAccounts.accounts[0].total).toEqual(100);
            expect(tableAccounts.accounts[0].subTotal).toEqual(85);
            // step 2
            OrdersUtil.addOrder(tableAccounts, new AccountOrderClass({
                price: 130,
                qty: 1,
                status: OrderStatusEnum.pending,
                type: OrderTypeEnum.dish,
                productId: 'B',
            }), tableAccounts.accounts[0].id);
            expect(tableAccounts.accounts[0].total).toEqual(230);
            expect(tableAccounts.accounts[0].subTotal).toEqual(195.5);
            // step 3
            OrdersUtil.addOrder(tableAccounts, new AccountOrderClass({
                price: 20,
                qty: 1,
                status: OrderStatusEnum.pending,
                type: OrderTypeEnum.beverage,
                productId: 'A',
            }), tableAccounts.accounts[0].id);
            expect(tableAccounts.accounts[0].total).toEqual(250);
            expect(tableAccounts.accounts[0].subTotal).toEqual(212.5);
            // step 4
            OrdersUtil.addOrder(tableAccounts, new AccountOrderClass({
                price: 23,
                qty: 1,
                status: OrderStatusEnum.pending,
                type: OrderTypeEnum.beverage,
                productId: 'B',
            }), tableAccounts.accounts[0].id);
            expect(tableAccounts.accounts[0].total).toEqual(273);
            expect(tableAccounts.accounts[0].subTotal).toEqual(232.5);
        });
    });
    describe('cancelOrder', () => {
        it('Debería quitar órdenes a una mesa y calcular el total y subtotal en múltiplos de 50 centavos.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 0,
                        subTotal: 0
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            // paso 2
            OrdersUtil.cancelOrder(tableAccounts, '1', '123');
            expect(tableAccounts.total).toEqual(173);
            expect(tableAccounts.subTotal).toEqual(147.5);
            // paso 3
            OrdersUtil.cancelOrder(tableAccounts, '1', '124');
            expect(tableAccounts.total).toEqual(43);
            expect(tableAccounts.subTotal).toEqual(37);
            // paso 4
            OrdersUtil.cancelOrder(tableAccounts, '1', '125');
            expect(tableAccounts.total).toEqual(23);
            expect(tableAccounts.subTotal).toEqual(20);
        });
    });
    describe('addDiscount', () => {
        it('Debería agregar descuentos a órdenes y recalcular el total y subtotal en múltiplos de 50 centavos.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 0,
                        subTotal: 0
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            // paso 2
            OrdersUtil.addDiscount(tableAccounts, '1', new AccountDiscountClass({
                giverId: '999',
                type: DiscountTypeEnum.other,
                percent: 20
            }));
            expect(tableAccounts.total).toEqual(218.5);
            expect(tableAccounts.subTotal).toEqual(186);
        });
    });
    describe('removeDiscount', () => {
        it('Debería remover el descuento a órdenes y recalcular el total y subtotal en múltiplos de 50 centavos.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [{ giverId: '999', type: DiscountTypeEnum.other, percent: 20, id: '123', reason: 'just because' }],
                        total: 218.5,
                        subTotal: 186
                    }
                ],
                tableId: '1',
                total: 218.5,
                subTotal: 186
            };
            // paso 2
            OrdersUtil.removeDiscount(tableAccounts, '1', '123');
            expect(tableAccounts.total).toEqual(273);
            expect(tableAccounts.subTotal).toEqual(232.5);
        });
    });
    describe('splitTableAccounts', () => {
        it('Debería crear dos cuentas en una tabla y calcular los totales y subtotales de las cuentas de la tabla en múltiplos de 50 centavos.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 273,
                        subTotal: 232.5
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            // paso 2
            OrdersUtil.splitTableAccounts(tableAccounts, '1', ['124', '126']);
            expect(tableAccounts.accounts[0]).toEqual(
                {
                    id: '1',
                    orders: [
                        { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                        { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                    ],
                    discounts: [],
                    total: 120,
                    subTotal: 102
                }
            );
            expect(omit(tableAccounts.accounts[1], 'id')).toEqual(
                {
                    orders: [
                        { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                        { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                    ],
                    discounts: [],
                    total: 153,
                    subTotal: 130.5
                },
            );
            expect(tableAccounts.total).toEqual(273);
            expect(tableAccounts.subTotal).toEqual(232.5);
        });
    });
    describe('joinTableAccounts', () => {
        it('Debería crear dos cuentas en una tabla y calcular los totales y subtotales de las cuentas de la tabla en múltiplos de 50 centavos.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                        ],
                        discounts: [],
                        total: 120,
                        subTotal: 102
                    },
                    {
                        id: '2',
                        orders: [
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 153,
                        subTotal: 130.5
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            // paso 2
            OrdersUtil.joinTableAccounts(tableAccounts, ['1', '2']);
            expect(tableAccounts.accounts.length).toEqual(1);
            expect(tableAccounts.accounts[0]).toEqual({
                id: '1',
                orders: [
                    { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                    { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                    { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                    { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                ],
                discounts: [],
                total: 273,
                subTotal: 232.5
            });
            expect(tableAccounts.total).toEqual(273);
            expect(tableAccounts.subTotal).toEqual(232.5);
        });
    });
    describe('confirmTableOrders', () => {
        it('Debería emitir el evento como se espera.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                        ],
                        discounts: [],
                        total: 120,
                        subTotal: 102
                    },
                    {
                        id: '2',
                        orders: [
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 153,
                        subTotal: 130.5
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            const eventEmitter = new EventEmitter();
            // paso 2
            const spyRef = spyOn(eventEmitter, 'emit');
            OrdersUtil.confirmTableOrders(tableAccounts, ['123', '124', '125', '126'], eventEmitter);
            expect(spyRef).toHaveBeenCalledOnceWith('confirmTableOrders', {
                table: '1',
                orders: [
                    { qty: 1, dish: 'A', price: 100, status: 4, type: 0, id: '123', productId: '1', productName: 'A', beverage: undefined, desert: undefined },
                    { qty: 1, price: 20, status: 4, type: 1, id: '125', productId: '3', productName: 'A', beverage: 'A', dish: undefined, desert: undefined },
                    { qty: 1, dish: 'B', price: 130, status: 4, type: 0, id: '124', productId: '2', productName: 'B', beverage: undefined, desert: undefined },
                    { qty: 1, price: 23, status: 4, type: 1, id: '126', productId: '4', productName: 'B', beverage: 'B', dish: undefined, desert: undefined },
                ]
            });
        });
    });
    describe('cancelOrders', () => {
        let tableAccounts: TableAccounts | undefined;
        let eventEmitter: EventEmitter | undefined;
        beforeEach(() => {
            // paso 1
            tableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                        ],
                        discounts: [],
                        total: 120,
                        subTotal: 102
                    },
                    {
                        id: '2',
                        orders: [
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 153,
                        subTotal: 130.5
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            eventEmitter = new EventEmitter();
        });
        const tests: {
            should: string;
            shouldCancelOrders: boolean;
        }[] = [
                {
                    should: 'No debería emitir el evento como se espera si se cancela fuera de tiempo.',
                    shouldCancelOrders: true
                },
                {
                    should: 'Debería emitir el evento como se espera si se cancela a tiempo.',
                    shouldCancelOrders: false
                },
            ];
        tests.forEach(({ should, shouldCancelOrders }) => {
            it(should, () => {
                const spyRef = spyOn(eventEmitter!, 'emit');
                if (!shouldCancelOrders) {
                    tableAccounts!.accounts[0].orders[0].status = OrderStatusEnum.cooking;
                }
                if (!shouldCancelOrders) {
                    expect(() => {
                        OrdersUtil.cancelOrders(tableAccounts!, ['123', '125'], eventEmitter!);
                    }).toThrowError('No se puede cancelar. Las órdenes ya se empezaron a preparar.');
                } else {
                    OrdersUtil.cancelOrders(tableAccounts!, ['123', '125'], eventEmitter!);
                }
                if (shouldCancelOrders) {
                    expect(spyRef).toHaveBeenCalledOnceWith('cancelTableOrders', {
                        table: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A', dish: 'A', beverage: undefined, desert: undefined },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A', beverage: 'A', dish: undefined, desert: undefined },
                        ]
                    });
                } else {
                    expect(spyRef).toHaveBeenCalledTimes(0);
                }
            });
        });
    });
    describe('modifyOrder', () => {
        it('Debería recalcular el total y subtotal en múltiplos de 50 centavos.', () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                        ],
                        discounts: [],
                        total: 120,
                        subTotal: 102
                    },
                    {
                        id: '2',
                        orders: [
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 153,
                        subTotal: 130.5
                    }
                ],
                tableId: '1',
                total: 273,
                subTotal: 232.5
            };
            // paso 2
            const orderToModify = tableAccounts.accounts[0].orders[1];
            OrdersUtil.modifyOrder(tableAccounts, '1', '125', {
                ...orderToModify,
                qty: 2
            });
            expect(tableAccounts).toEqual({
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 20, qty: 2, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                        ],
                        discounts: [],
                        total: 140,
                        subTotal: 119
                    },
                    {
                        id: '2',
                        orders: [
                            { price: 130, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '124', productId: '2', productName: 'B' },
                            { price: 23, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '126', productId: '4', productName: 'B' },
                        ],
                        discounts: [],
                        total: 153,
                        subTotal: 130.5
                    }
                ],
                tableId: '1',
                total: 293,
                subTotal: 249.5
            });
        });
    });
    describe('payTableAccounts', () => {
        it('Debería mandar llamar al servicio de pagos y de recibir confirmación, mandar llamar al servicio de persistencia en la base de datos con los datos esperados.', async () => {
            // paso 1
            const tableAccounts: TableAccounts = {
                accounts: [
                    {
                        id: '1',
                        orders: [
                            { price: 100, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.dish, id: '123', productId: '1', productName: 'A' },
                            { price: 20, qty: 1, status: OrderStatusEnum.pending, type: OrderTypeEnum.beverage, id: '125', productId: '3', productName: 'A' },
                        ],
                        discounts: [],
                        total: 0,
                        subTotal: 0
                    }
                ],
                tableId: '1',
                total: 120,
                subTotal: 102
            };
            const eventEmitter = new EventEmitter();
            const injector = new Injector();
            const fakePaymentService = new FakePaymentService();
            const fakeDBService = new FakeDBService();
            injector.set('FakePaymentService', fakePaymentService);
            injector.set('FakeDBService', fakeDBService);
            fakePaymentService.customPayTableOrdersResponse = {
                id: '999',
                paymentType: 'card'
            };
            const spyRef = spyOn(fakeDBService, 'persistDBModels');
            await OrdersUtil.payTableAccounts(tableAccounts, ['1'], 'card', eventEmitter, injector);
            expect(fakePaymentService.payTableOrdersPayload).toEqual({ total: 120, paymentType: 'card' });
            expect(spyRef).toHaveBeenCalledOnceWith({
                type: 'editDBTable',
                model: 'orders',
                data: [
                    {
                        orderId: '123',
                        status: 'P',
                        paymentId: '999',
                        paymentType: 'card'
                    },
                    {
                        orderId: '125',
                        status: 'P',
                        paymentId: '999',
                        paymentType: 'card'
                    },
                ]
            })
        });
    });
});
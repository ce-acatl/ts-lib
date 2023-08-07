import EventEmitter from 'events';
import { Injector } from './Injector.class';
import { FakePaymentService } from './testing-tools/fake-payment-service';
import { FakeDBService } from './testing-tools/fake-db-service';

export class OrdersUtil {
    static taxPercent: number = 15;
    static getTaxExcent(total: number): number {
        return total * ((100 - OrdersUtil.taxPercent) / 100);
    }
    /**
     * Debería agregar órdenes a una mesa y calcular el total y subtotal en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param order 
     * @param accountId 
     */
    static addOrder(tableAccounts: TableAccounts, order: AccountOrder, accountId?: string) {
        const account = OrdersUtil.getTableAccount(tableAccounts, accountId);
        account.orders.push(order);
        OrdersUtil.recalculateTableAccounts(tableAccounts);
    }
    static recalculateTableAccounts(tableAccounts: TableAccounts): void {
        let total = 0;
        let subTotal = 0;
        tableAccounts.accounts.forEach(a => {
            let totalA = 0;
            a.orders.forEach(o => {
                const totalO = o.price * o.qty;
                totalA += totalO;
            });
            totalA = OrdersUtil.applyAccountDiscounts(a, totalA);
            total += totalA;
            const subTotalA = OrdersUtil.getTaxExcent(totalA);
            subTotal += subTotalA;
            const aTotal = OrdersUtil.getMoney(totalA);
            const aSubTotal = OrdersUtil.getMoney(subTotalA);
            a.total = aTotal;
            a.subTotal = aSubTotal;
            // console.log({ totalA, subTotalA, total, subTotal, aTotal, aSubTotal })
        });
        tableAccounts.total = OrdersUtil.getMoney(total);
        tableAccounts.subTotal = OrdersUtil.getMoney(subTotal);
    }
    static applyAccountDiscounts(a: TableAccount, totalA: number): number {
        let r = +totalA;
        a.discounts.forEach(d => {
            if (d.amount) {
                r -= d.amount;
            }
            if (d.percent) {
                r = (r * ((100 - d.percent) / 100));
            }
            if (d.type === DiscountTypeEnum.free) {
                r = 0;
            }
        });
        return r;
    }
    static getMoney(totalA: number): number {
        const t = +totalA.toFixed(2);
        if (t % .5 === 0) {
            return t;
        } else {
            const ceil = Math.ceil(t);
            const floor = Math.floor(t);
            if (t > (floor + .5)) {
                return ceil;
            } else {
                if (t !== floor) {
                    return floor + .5;
                } else {
                    return floor;
                }
            }
        }
    }
    static getTableAccount(tableAccounts: TableAccounts, accountId?: string): TableAccount {
        let account: TableAccount | undefined;
        if (!accountId) {
            account = new AccountClass();
            tableAccounts.accounts.push(account);
            accountId = account.id;
        }
        account = tableAccounts.accounts.find(a => a.id === accountId);
        return account!;
    }
    /**
     * Debería quitar órdenes a una mesa y calcular el total y subtotal en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param accountId 
     * @param orderId 
     */
    static cancelOrder(tableAccounts: TableAccounts, accountId: string, orderId: string, recalculate = true) {
        const account = OrdersUtil.getTableAccount(tableAccounts, accountId);
        const indexToRemove = account.orders.findIndex(o => o.id === orderId);
        if (indexToRemove !== -1) {
            account.orders.splice(indexToRemove, 1);
        }
        if (recalculate) {
            OrdersUtil.recalculateTableAccounts(tableAccounts);
        }
    }
    /**
     * Debería agregar descuentos a órdenes y recalcular el total y subtotal en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param accountId 
     * @param discount 
     */
    static addDiscount(tableAccounts: TableAccounts, accountId: string, discount: Discount) {
        const account = OrdersUtil.getTableAccount(tableAccounts, accountId);
        account.discounts.push(discount);
        OrdersUtil.recalculateTableAccounts(tableAccounts);
    }
    /**
     * Debería remover el descuento a órdenes y recalcular el total y subtotal en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param accountId 
     * @param discountId 
     */
    static removeDiscount(tableAccounts: TableAccounts, accountId: string, discountId: string) {
        const account = OrdersUtil.getTableAccount(tableAccounts, accountId);
        const indexToRemove = account.discounts.findIndex(d => d.id === discountId);
        if (indexToRemove !== -1) {
            account.discounts.splice(indexToRemove, 1);
            OrdersUtil.recalculateTableAccounts(tableAccounts);
        }
    }
    /**
     * Debería crear dos cuentas en una tabla y calcular los totales y subtotales de las cuentas de la tabla en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param accountToSplit 
     * @param ordersToTake 
     */
    static splitTableAccounts(tableAccounts: TableAccounts, accountToSplit: string, ordersToTake: string[]) {
        const account = OrdersUtil.getTableAccount(tableAccounts, accountToSplit);
        const newAccount = new AccountClass();
        ordersToTake.forEach(o => {
            const orderIndex = account.orders.findIndex(or => or.id === o);
            if (orderIndex !== -1) {
                const order = account.orders[orderIndex]!;
                // first clone orders into new account
                newAccount.orders.push(order);
                // then delete the orders in the first account
                account.orders.splice(orderIndex, 1);
            }
        });
        tableAccounts.accounts.push(newAccount);
        OrdersUtil.recalculateTableAccounts(tableAccounts);
    }
    /**
     * Debería crear dos cuentas en una tabla y calcular los totales y subtotales de las cuentas de la tabla en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param accountsToJoin 
     */
    static joinTableAccounts(tableAccounts: TableAccounts, accountsToJoin: string[]) {
        const ordersFromAccounts: AccountOrder[] = [];
        const discountsFromAccounts: Discount[] = [];
        // only first id will be preserved
        const id = accountsToJoin[0];
        tableAccounts.accounts.forEach(a => {
            if (accountsToJoin.includes(a.id!)) {
                ordersFromAccounts.push(...a.orders);
                discountsFromAccounts.push(...a.discounts);
            }
        });
        const account = OrdersUtil.getTableAccount(tableAccounts, id);
        account.discounts = discountsFromAccounts;
        account.orders = ordersFromAccounts;
        for (let i = 1; i < accountsToJoin.length; i++) {
            const keyToDelete = accountsToJoin[i];
            const indexToRemove = tableAccounts.accounts.findIndex(a => a.id === keyToDelete);
            if (indexToRemove !== -1) {
                tableAccounts.accounts.splice(indexToRemove, 1);
            }
        }
        OrdersUtil.recalculateTableAccounts(tableAccounts);
    }
    /**
     * Debería emitir el evento como se espera.
     * @param tableAccounts 
     * @param ordersToConfirm 
     * @param eventEmitter 
     */
    static confirmTableOrders(tableAccounts: TableAccounts, ordersToConfirm: string[], eventEmitter: EventEmitter) {
        eventEmitter.emit('confirmTableOrders', {
            table: tableAccounts.tableId,
            orders: OrdersUtil.getAllOrders(ordersToConfirm, tableAccounts)
        });
    }
    static getAllOrders(ordersToConfirm: string[], tableAccounts: TableAccounts): ConfirmedAccountOrder[] {
        return tableAccounts.accounts.reduce((a, b) => {
            const orders = b.orders.filter(o => ordersToConfirm.includes(o.id!));
            if (orders.length > 0) {
                const confirmedOrders = orders.map(oo => {
                    const order: ConfirmedAccountOrder = {
                        ...oo,
                        dish: oo.type === OrderTypeEnum.dish ? oo.productName! : undefined,
                        beverage: oo.type === OrderTypeEnum.beverage ? oo.productName! : undefined,
                        desert: oo.type === OrderTypeEnum.dessert ? oo.productName! : undefined
                    };
                    return order;
                });
                a.push(...confirmedOrders);
            }
            return a;
        }, [] as ConfirmedAccountOrder[]);
    }
    /**
     * No debería emitir el evento como se espera si se cancela fuera de tiempo.
     * Debería emitir el evento como se espera si se cancela a tiempo.
     * @param tableAccounts 
     * @param ordersToCancel 
     * @param eventEmitter 
     */
    static cancelOrders(tableAccounts: TableAccounts, ordersToCancel: string[], eventEmitter: EventEmitter) {
        const areOrdersCancellable: boolean = OrdersUtil.areOrdersCancellable(tableAccounts, ordersToCancel);
        if (areOrdersCancellable) {
            OrdersUtil.recalculateTableAccounts(tableAccounts);
            const orders = OrdersUtil.getAllOrders(ordersToCancel, tableAccounts);
            eventEmitter.emit('cancelTableOrders', {
                table: tableAccounts.tableId,
                orders
            });
            tableAccounts.accounts.forEach(a => {
                a.orders.forEach(o => {
                    if (ordersToCancel.includes(o.id!)) {
                        OrdersUtil.cancelOrder(tableAccounts, a.id!, o.id!, false);
                    }
                });
            });
        } else {
            throw new Error('No se puede cancelar. Las órdenes ya se empezaron a preparar.');
        }
    }
    static areOrdersCancellable(tableAccounts: TableAccounts, ordersToCancel: string[]): boolean {
        for (const a of tableAccounts.accounts) {
            for (const o of a.orders) {
                if ([OrderStatusEnum.cooking, OrderStatusEnum.payed, OrderStatusEnum.ready, OrderStatusEnum.cancelled].includes(o.status)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Debería recalcular el total y subtotal en múltiplos de 50 centavos.
     * @param tableAccounts 
     * @param accountId 
     * @param orderId 
     */
    static modifyOrder(tableAccounts: TableAccounts, accountId: string, orderId: string, newOrder: AccountOrder) {
        const account = OrdersUtil.getTableAccount(tableAccounts, accountId);
        const orderIndex = account.orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            account.orders.splice(orderIndex, 1, newOrder);
            OrdersUtil.recalculateTableAccounts(tableAccounts);
        }
    }
    /**
     * Debería mandar llamar al servicio de pagos y de recibir confirmación, mandar llamar al servicio de persistencia en la base de datos con los datos esperados.
     * @param tableAccounts 
     * @param accountsToPay 
     * @param eventEmitter 
     * @param injector 
     */
    static async payTableAccounts(tableAccounts: TableAccounts, accountsToPay: string[], paymentMethod: string, eventEmitter: EventEmitter, injector: Injector): Promise<void> {
        try {
            const orders = OrdersUtil.getAllOrdersOfAccounts(accountsToPay, tableAccounts);
            const total: number = OrdersUtil.getTotalOfOrders(orders);
            const r = await injector.get(FakePaymentService).payTableOrders(total, paymentMethod);
            if (r.id) {
                const rr = await injector.get(FakeDBService).persistDBModels({
                    type: 'editDBTable',
                    model: 'orders',
                    data: orders.map(o => {
                        return {
                            orderId: o.id,
                            status: 'P',
                            paymentId: r.id,
                            paymentType: paymentMethod
                        }
                    })
                });
                return rr;
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
    static getTotalOfOrders(orders: AccountOrder[]): number {
        return orders.reduce((a, b) => {
            a += b.qty * b.price;
            return a;
        }, 0);
    }
    static getAllOrdersOfAccounts(accountsToPay: string[], tableAccounts: TableAccounts): AccountOrder[] {
        const orders: AccountOrder[] = [];
        const accounts = tableAccounts.accounts.filter(a => accountsToPay.includes(a.id!));
        accounts.forEach(a => {
            orders.push(...a.orders);
        });
        return orders;
    }
}

export interface TableAccounts {
    tableId: string;
    accounts: TableAccount[];
    total: number;
    subTotal: number;
}

export interface TableAccount {
    id?: string;
    orders: AccountOrder[];
    total: number;
    subTotal: number;
    discounts: Discount[]
}

export interface Discount {
    id?: string;
    type: DiscountTypeEnum;
    amount?: number;
    percent?: number;
    giverId: string;
    reason?: string;
}

export enum DiscountTypeEnum {
    admin,
    superAdmin,
    birthDate,
    special,
    friendOrFamily,
    other,
    free
}

export interface AccountOrder {
    id?: string;
    type: OrderTypeEnum;
    productId?: string;
    productName?: string;
    price: number;
    qty: number;
    status: OrderStatusEnum;
}

export enum OrderStatusEnum {
    cooking,
    ready,
    cancelled,
    payed,
    pending
}

export interface ConfirmedAccountOrder extends AccountOrder {
    dish?: string;
    beverage?: string;
    desert?: string;
}

export enum OrderTypeEnum {
    dish,
    beverage,
    dessert
}

export class AccountOrderClass implements AccountOrder {
    id?: string = new Date().valueOf() + '';
    price: number = 0;
    productId?: string;
    productName?: string;
    qty: number = 1;
    status: OrderStatusEnum = OrderStatusEnum.pending;
    type: OrderTypeEnum = OrderTypeEnum.dish;
    constructor(acc: AccountOrder) {
        return {
            id: this.id,
            price: acc.price,
            productId: acc.productId,
            productName: acc.productName,
            qty: acc.qty,
            status: acc.status,
            type: acc.type
        };
    }
}

export class AccountClass implements TableAccount {
    id?: string = new Date().valueOf() + '';
    orders: AccountOrder[] = [];
    discounts: Discount[] = [];
    subTotal: number = 0;
    total: number = 0;
    constructor() {
        return {
            id: this.id,
            orders: this.orders,
            discounts: this.discounts,
            subTotal: this.subTotal,
            total: this.total
        }
    }
}

export class AccountDiscountClass implements Discount {
    id?: string = new Date().valueOf() + '';
    amount?: number = 0;
    giverId: string = '';
    percent?: number;
    reason?: string;
    type: DiscountTypeEnum = DiscountTypeEnum.other;
    constructor(discount: Discount) {
        if (discount.id) {
            this.id = discount.id;
        }
        return {
            ...discount,
            id: this.id
        }
    }
}
export class FakePaymentService {
    customPayTableOrdersResponse?: {
        id: string;
        paymentType: string;
    };
    payTableOrdersPayload: any;
    async payTableOrders(total: number, paymentType: string) {
        this.payTableOrdersPayload = {
            total,
            paymentType
        };
        return new Promise((r) => {
            return r(!!this.customPayTableOrdersResponse ? this.customPayTableOrdersResponse : {
                id: '12345',
                paymentType
            });
        });
    }
}
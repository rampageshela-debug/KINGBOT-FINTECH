export async function execute({signal,enabled,connector}){
 if(!enabled)return{status:"LOCKED",reason:"TRADING_DISABLED"};
 if(!connector||typeof connector.placeOrder!=="function")return{status:"BLOCKED",reason:"BROKER_CONNECTOR_NOT_CONFIGURED"};
 if(signal.direction==="NO_TRADE")return{status:"BLOCKED",reason:"NO_TRADE_SIGNAL"};
 return connector.placeOrder(signal);
}
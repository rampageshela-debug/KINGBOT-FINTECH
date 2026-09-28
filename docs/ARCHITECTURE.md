# BOT KING 2.0 Architecture

Browser -> API -> Strategy Engine -> Risk Engine -> Execution Gateway -> Broker Connector -> Audit/Data.

Strategies never place orders directly. The risk engine is independent from strategy logic. The execution gateway is the only broker-facing boundary.

TRADING_ENABLED=false is the default live state.

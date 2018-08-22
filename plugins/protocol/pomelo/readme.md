pomelo 通信协议：

# 连接建立协议格式
1. 握手：交换数据
2. 心跳：心跳字节标识

# 消息打包协议
4. package.decode:message
5. package.encode:message
6. message.decode:message
7. message.encode:send

# 消息处理:
1. request 消息处理： 有msgid的消息
2. response消息处理，没有msgid的消息
3. notify消息处理： 构造0的msgid
4. push消息处理： 添加session.push
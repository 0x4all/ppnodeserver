Acceptor:
 * 接受 tcp或者websocket的连接
 * 
 * 1.在tcp层接收数据：
 * 2.如果发现是http数据，就将该socket转移到一个内部的websocketServer处理，进入websocket的处理机制
 * 3.将tcp连接的socket 和 websocket的 socket 合并到 新的抽象socket，在触发 connection
 * 
 * methods:
 *    start()
 *    stop();
 * 事件:
 *    connection:(socket)
 *    error:(error)


Socket

 * TCPSocket 通过封装读包逻辑，将每个package读出来后再抛出来，
 * 使得和websocket的行为一致，抛到上层都是1个完整的包
 * properties:
 *    
 * methods:
 *    send(msg,cb): 通过原生socket发送数据
 *    disconnect(); 关闭原生socket，触发disconnect事件
 * events：
 *    disconnect: socket 关闭了
 *    error: socket error:
 *    message: 收到 message消息: 一个完整包


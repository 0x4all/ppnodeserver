interface HeartBeatConfig {
    /**
     * 是否超时断开
     */
    disconnectOnTimeout:boolean;

    /**
     * 心跳间隔时间，单位：秒
     */
    heartbeat:number;

    /**
     * 超时时间，单位：秒
     */
    timeout:number;

}


interface MessageProtocolConfig {
    /**
     * pomelo dictionary component; optional
     */
    dictionary:Object;
    /**
     * pomelo protobuf component; optional
     */
    protobuf: Object; 
    /**
     * pomelo decodeIO_protobuf component; optional
     */
    decodeIO_protobuf:Object; //
}
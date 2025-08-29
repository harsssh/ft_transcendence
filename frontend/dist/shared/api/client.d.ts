export declare const client: {
    helloService: import("@connectrpc/connect").Client<import("@bufbuild/protobuf/codegenv2").GenService<{
        say: {
            methodKind: "unary";
            input: typeof import("@workspace/generated/connectrpc/hello/v1/hello_pb").SayRequestSchema;
            output: typeof import("@workspace/generated/connectrpc/hello/v1/hello_pb").SayResponseSchema;
        };
    }>>;
};

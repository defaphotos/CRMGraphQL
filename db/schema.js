const {gql} = require('apollo-server');

const typeDefs = gql`

    # Input

    input UsuarioInput {
        nombre: String!
        apellido: String!
        email: String!
        password: String!
    }

    input AutenticarInput{
        email: String!
        password: String!
    }

    input ProductoInput{
        nombre: String!
        existencia: Int!
        precio: Float!
    }

    input ClienteInput{
        nombre: String!
        apellido: String!
        empresa: String!
        email: String!
        telefono: String
    }

    input PedidoProductoInput{
        id: ID
        cantidad: Int
        nombre:String!
    }

    input PedidoInput{
        pedido: [PedidoProductoInput]
        total: Float
        cliente: ID
        estado: EstadoPedido
    } 

    enum EstadoPedido{
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    # Types

    type Cliente{
        id: ID
        nombre: String
        apellido: String
        empresa: String
        email: String
        telefono: String
        vendedor: ID
    }

    type Usuario{
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }

    type Token{
        token: String
    }

    type Producto{
        id: ID
        nombre: String
        existencia: Int
        precio: Float
        creado:String
    }

    type Pedido{
        id: ID
        pedido:[PedidoGrupo]
        total:Float
        cliente: Cliente
        vendedor:ID
        estado: EstadoPedido
        creado: String
    }

    type PedidoGrupo{
        id: ID
        cantidad:Int
        nombre:String
    }

    type TopCliente{
        total:Float
        cliente:[Cliente]
    }

    type TopVendedor{
        total: Float
        vendedor:[Usuario]
    }


    type Top{
        cantidad:Float
        vendedor:[Usuario]
    }



    # Query

    type Query{
        # Usuario
        obtenerUsuario: Usuario

        # Producto
        obtenerProductos:[Producto]
        obtenerProducto(id: ID!):Producto

        # Cliente
        obtenerClientes:[Cliente]
        obtenerClientesVendedor:[Cliente]
        obtenerCliente(id: ID!):Cliente

        # Pedido
        obtenerPedidos:[Pedido]
        obtenerPedidosVendedor: [Pedido]
        obtenerPedido(id: ID!): Pedido
        obtenerPedidosEstado(estado:EstadoPedido!):[Pedido]

        # Busquedas Avanzadas
        mejoresClientes:[TopCliente]
        mejoresVendedores:[TopVendedor]
        buscarProducto(texto:String!):[Producto]
        cantidadProductoVendedor:[Top]
    }

    # Mutation

    type Mutation{

        # Usuario
        nuevoUsuario(input: UsuarioInput!): Usuario
        autenticarUsuario(input: AutenticarInput):Token

        # Producto
        nuevoProducto(input: ProductoInput): Producto
        actualizarProducto(id: ID!,input: ProductoInput):Producto
        eliminarProducto(id: ID!):String

        # Cliente
        nuevoCliente(input: ClienteInput): Cliente
        actualizarCliente(id: ID!, input: ClienteInput):Cliente
        eliminarCliente(id: ID!):String

        # Pedidos
        nuevoPedido(input:PedidoInput):Pedido
        actualizarPedido(id:ID!, input: PedidoInput): Pedido
        eliminarPedido(id: ID!):String
    }
`;

module.exports = typeDefs;
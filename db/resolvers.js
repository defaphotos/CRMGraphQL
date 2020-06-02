const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");

const bcryptjs = require("bcryptjs");
require("dotenv").config({ path: "variables.env" });
const jwt = require("jsonwebtoken");

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido, creado } = usuario;

  return jwt.sign({ id, email, nombre, apellido, creado }, secreta, {
    expiresIn,
  });
};

const resolvers = {
  Query: {
    obtenerUsuario: async (_, { },ctx) => {
     return ctx.usuario;
    },
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("El producto no existe");
      }

      return producto;
    },
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerClientesVendedor: async (_, {}, ctx) => {
      try {
        console.log(ctx);
        const clientes = await Cliente.find({
          vendedor: ctx.usuario.id.toString(),
        });
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      const existeCliente = await Cliente.findById(id);
      if (!existeCliente) {
        throw new Error("El cliente no existe");
      }

      if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      return existeCliente;
    },
    obtenerPedidos: async () => {
      const pedidos = await Pedido.find({});
      return pedidos;
    },
    obtenerPedidosVendedor: async (_, {}, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id }).populate('cliente');
      return pedidos;
    },
    obtenerPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      return pedido;
    },
    obtenerPedidosEstado: async (_, { estado }, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });
      return pedidos;
    },
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },

        { $group: { _id: "$cliente", total: { $sum: "$total" } } },

        {
          $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente",
          },
        },
        
        {
          $sort: {
            total: -1,
          },
        },
      ]);
      return clientes;
    },
    mejoresVendedores:async()=>{
      const vendedores = await Pedido.aggregate([
        {$match: {estado:"COMPLETADO"}},
        {
          $group: {
            _id: "$vendedor",
            total: {$sum: "$total"}
          }
        },
        {
          $lookup:{
            from:"usuarios",
            localField:"_id",
            foreignField:"_id",
            as:"vendedor"
          }
        },
        {
          $sort:{
            total:-1
          }
        },  
        {
          $limit:2
        }
      ]);

      return vendedores;
    },
    buscarProducto:async(_,{texto})=>{
      const productos = await Producto.find({$text:{$search: texto}});
      return productos;
    }
  },
  Mutation: {
    //Usuario
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });

      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }

      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });

      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      const esCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );

      if (!esCorrecto) {
        throw new Error("El password es incorrecto");
      }

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h'),
      };
    },

    //Producto
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);
        const resultado = producto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("El producto no existe");
      }

      const resultado = await Producto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return resultado;
    },
    eliminarProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("El producto no existe");
      }
      await Producto.findByIdAndDelete({ _id: id });
      return "Producto eliminado";
    },

    //Cliente
    nuevoCliente: async (_, { input }, ctx) => {
      const { email } = input;

      const existeCliente = await Cliente.findOne({ email });
      if (existeCliente) {
        throw new Error("El cliente ya existe");
      }
      const cliente = new Cliente(input);
      cliente.vendedor = ctx.usuario.id;

      try {
        const resultado = await cliente.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("El cliente no existe");
      }
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      cliente = await Cliente.findByIdAndUpdate({ _id: id }, input, {
        new: true,
      });
      return cliente;
    },
    eliminarCliente: async (_, { id }, ctx) => {
      const cliente = await Cliente.findById(id);

      if (!cliente) {
        throw new Error("El cliente no existe");
      }

      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      await Cliente.findOneAndDelete({ _id: id });
      return "Cliente eliminado";
    },

    //Pedido
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;

      const existeCliente = await Cliente.findById(cliente);

      if (!existeCliente) {
        throw new Error("El cliente no existe");
      }

      if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }

      for await (const articulo of input.pedido) {
        const { id, cantidad } = articulo;

        const producto = await Producto.findById(id);

        if (producto.existencia < cantidad) {
          throw new Error(
            `El articulo ${producto.nombre} excede la cantidad disponible`
          );
        } else {
          producto.existencia = producto.existencia - cantidad;
          await producto.save();
        }
      }

      const nuevoPedido = new Pedido(input);
      nuevoPedido.vendedor = ctx.usuario.id;

      const resultado = await nuevoPedido.save();
      return resultado;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente, pedido } = input;
      const existePedido = await Pedido.findById(id);

      if (!existePedido) {
        throw new Error("El pedido no existe");
      }

      const existeCliente = await Cliente.findById(cliente);

      if (!existeCliente) {
        throw new Error("No existe cliente");
      }

      if (existePedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene las credenciales");
      }
      if( pedido ) {
        for await (const articulo of pedido) {
          //obtener actual cantidad articulos
          const pedidoActual = await Producto.findById(articulo.id);
          const actualCantidadArticulos = pedidoActual.existencia;
          const cantidadPedida = existePedido.pedido.find(
            (itemArticulo) => itemArticulo.id === articulo.id
          ).cantidad;

          const devolverCantidad = actualCantidadArticulos + cantidadPedida;

          if (devolverCantidad < articulo.cantidad) {
            throw new Error(
              `El articulo ${pedidoActual.nombre} excede la cantidad disponible`
            );
          } else {
            pedidoActual.existencia = devolverCantidad - articulo.cantidad;
            await pedidoActual.save();
          }
        }
      }

      const nuevoPedido = await Pedido.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return nuevoPedido;
    },
    eliminarPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);

      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene las credenciales");
      }

      for await (const producto of pedido.pedido) {
        //obtener actual cantidad articulos
        const pedidoActual = await Producto.findById(producto.id);
        const actualCantidadArticulos = pedidoActual.existencia;
        const cantidadPedida = pedido.pedido.find(
          (itemArticulo) => itemArticulo.id === producto.id
        ).cantidad;

        const devolverCantidad = actualCantidadArticulos + cantidadPedida;

        pedidoActual.existencia = devolverCantidad;
        await pedidoActual.save();
      }

      await Pedido.findOneAndDelete({ _id: id });
      return "Pedido eliminado";
    },
  },
};

module.exports = resolvers;

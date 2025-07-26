'use strict';
import chalk from 'chalk';
import { AppDataSource } from './configDB.js';
import Productos from '../entity/productos.entity.js';
import Usuarios from '../entity/usuario.entity.js';
import Categoria from '../entity/categoria.entity.js';
import Valoraciones from '../entity/valoraciones.entity.js';
import Compra from '../entity/compra.entity.js';
import CompraProducto from '../entity/compra_producto.entity.js';
import Envio from '../entity/envio.entity.js';
import { encryptPassword } from '../helpers/bcrypt.helper.js';

async function createUser() {
  try {
    const UserRepository = AppDataSource.getRepository(Usuarios);
    const count = await UserRepository.count();
    if (count > 0) {
      console.log(chalk.yellow("ℹ️  Usuarios ya existen. Se omite creación."));
      return;
    }
    await Promise.all([
      UserRepository.save(UserRepository.create({
        nombreCompleto: "Admin",
        email: "admin2025@gmail.com",
        telefono: "966433091",
        password: await encryptPassword("admin123"),
        rol: "admin",
      })),
      UserRepository.save(UserRepository.create({
        nombreCompleto: "Benjamin Ortiz",
        email: "benjamin@gmail.com",
        telefono: "966433091",
        password: await encryptPassword("benja123"),
        rol: "cliente",
      })),
      UserRepository.save(UserRepository.create({
        nombreCompleto: "Joaquin Perez",
        email: "joaquin@gmail.com",
        telefono: "978294813",
        password: await encryptPassword("joaquin123"),
        rol: "cliente",
      })),
      UserRepository.save(UserRepository.create({
        nombreCompleto: "Jonathan Olivares",
        email: "jonathan@gmail.com",
        telefono: "912345678",
        password: await encryptPassword("jonathan123"),
        rol: "cliente",
      })),
      UserRepository.save(UserRepository.create({
        nombreCompleto: "Pablo Sanchez",
        email: "pablo@gmail.com",
        telefono: "9987654321",
        password: await encryptPassword("pablo123"),
        rol: "cliente",
      })),
      UserRepository.save(UserRepository.create({
        nombreCompleto: "Tomas Saez",
        email: "tomas@gmail.com",
        telefono: "912345678",
        password: await encryptPassword("tomas123"),
        rol: "cliente",
      }))
    ]);
    console.log(chalk.green("✅ Usuarios creados exitosamente."));
  } catch (error) {
    console.error(chalk.red("❌ Error al crear usuarios:", error));
  }
}

async function createCategoria() {
  try {
    const CategoriaRepository = AppDataSource.getRepository(Categoria);
    const count = await CategoriaRepository.count();
    if (count > 0) {
      console.log(chalk.yellow("ℹ️  Categorías ya existen. Se omite creación."));
      return;
    }
    await Promise.all([
      CategoriaRepository.save(CategoriaRepository.create({
        nombre: "Juguetes",
        descripcion: "Juguetes de madera para niños"
      })),
      CategoriaRepository.save(CategoriaRepository.create({
        nombre: "Decoración",
        descripcion: "Artículos decorativos de madera"
      })),
      CategoriaRepository.save(CategoriaRepository.create({
        nombre: "Muebles",
        descripcion: "Muebles de madera artesanales"
      })),
      CategoriaRepository.save(CategoriaRepository.create({
        nombre: "Construcción",
        descripcion: "Materiales de madera para construcción"
      })),
    ]);
    console.log(chalk.green("✅ Categorías creadas exitosamente."));
  } catch (error) {
    console.error(chalk.red("❌ Error al crear categorías:", error));
  }
}

async function createProductos() {
  try {
    const ProductosRepository = AppDataSource.getRepository(Productos);
    const count = await ProductosRepository.count();
    if (count > 0) {
      console.log(chalk.yellow("ℹ️  Productos ya existen. Se omite creación."));
      return;
    }
    await Promise.all([
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Jardinera",
        precio: 20000,
        prom_valoraciones: 3,
        stock: 10,
        descripcion: "Ideal para plantas y decorar tu hogar con estilo ya sea en interiores o exteriores.",
        estado: "activo",
        image_url: "jardinera.jpg",
        id_categoria:2,
        alto: 30,
        ancho: 60,
        profundidad: 20,
        peso: 5.5
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Macetero",
        precio: 10000,
        prom_valoraciones: 3,
        stock: 10,
        descripcion: "Macetero de madera para plantas pequeñas.",
        estado: "activo",
        image_url: "macetero.webp",
        id_categoria:2,
        alto: 30,
        ancho: 15,
        profundidad: 15,
        peso: 2.2
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Medallero",
        precio: 25000,
        prom_valoraciones: 3,
        stock: 10,
        descripcion: "Estante para medallas, ideal para exhibir tus logros deportivos.",
        estado: "activo",
        image_url: "medallero.webp",
        id_categoria:2,
        alto: 30,
        ancho: 2,
        profundidad: 20,
        peso: 1.5
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Escaño",
        precio: 120000,
        prom_valoraciones: 5,
        stock: 20,
        descripcion: "Escaño de madera maciza, perfecto para exteriores. Resistente y duradero.",
        estado: "activo",
        image_url:"escaño.webp",
        id_categoria:3,
        alto: 50,
        ancho: 60,
        profundidad: 60,
        peso: 25
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Mesa de centro",
        precio: 69000,
        stock: 5,
        descripcion: "Mesa de centro de madera, ideal para tu sala de estar.",
        estado: "activo",
        image_url:"mesacentro.webp",
        id_categoria:3,
        alto: 30,
        ancho: 60,
        profundidad: 60,
        peso: 12
      })),
      // Productos extra del initial setup de ejemplo
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Silla de madera",
        precio: 25000,
        stock: 20,
        descripcion: "Silla de madera para comedor.",
        estado: "activo",
        image_url:"silla_de_madera.webp",
        id_categoria:3,
        alto: 30,
        ancho: 60,
        profundidad: 60,
        peso: 8
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Estantería",
        precio: 50000,
        stock: 3,
        descripcion: "Estantería de madera para libros y decoración.",
        estado: "activo",
        image_url:"estanteria.webp",
        id_categoria:3,
        alto: 30,
        ancho: 60,
        profundidad: 20,
        peso: 15
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Escritorio",
        precio: 60000,
        stock: 10,
        descripcion: "Escritorio de madera para oficina o estudio.",
        estado: "activo",
        image_url:"escritorio.webp",
        id_categoria:3,
        alto: 75,
        ancho: 60,
        profundidad: 20,
        peso: 18
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Juguete de madera",
        precio: 10000,
        prom_valoraciones: 4,
        stock: 10,
        descripcion: "Juguete de madera para niños, seguro y divertido.",
        estado: "activo",
        image_url: "juguete_de_madera.webp",
        id_categoria:1,
        alto: 15,
        ancho: 15,
        profundidad: 15,
        peso: 1
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Puzzle de madera",
        precio: 15000,
        prom_valoraciones: 4,
        stock: 15,
        descripcion: "Puzzle de madera para desarrollar habilidades cognitivas.",
        estado: "activo",
        image_url: "puzzle_de_madera.webp",
        id_categoria:1,
        alto: 15,
        ancho: 15,
        profundidad: 15,
        peso: 1
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Lotes de Madera",
        precio: 12000,
        prom_valoraciones: 4,
        stock: 20,
        descripcion: "Lotes de madera para construir.",
        estado: "activo",
        image_url: "lotes_de_madera.webp",
        id_categoria:4,
        alto: 4,
        ancho: 15,
        profundidad: 100,
        peso: 10
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Madera prensada",
        precio: 8000,
        prom_valoraciones: 4,
        stock: 30,
        descripcion: "Madera prensada para construcción y manualidades.",
        estado: "activo",
        image_url: "madera_prensada.webp",
        id_categoria:4,
        alto: 4,
        ancho: 15,
        profundidad: 100,
        peso: 8
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Tablero de madera",
        precio: 15000,
        prom_valoraciones: 4,
        stock: 25,
        descripcion: "Tablero de madera para proyectos de carpintería.",
        estado: "activo",
        image_url: "tablero_de_madera.webp",
        id_categoria:4,
        alto: 4,
        ancho: 15,
        profundidad: 100,
        peso: 9
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Viga de madera",
        precio: 30000,
        prom_valoraciones: 4,
        stock: 10,
        descripcion: "Viga de madera para construcción.",
        estado: "activo",
        image_url: "viga_de_madera.webp",
        id_categoria:4,
        alto: 10,
        ancho: 15,
        profundidad: 200,
        peso: 20
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Bandeja de madera",
        precio: 15000,
        prom_valoraciones: 4,
        stock: 10,
        descripcion: "Bandeja de madera para servir o decorar.",
        estado: "activo",
        image_url: "bandeja_de_madera.webp",
        id_categoria:2,
        alto: 5,
        ancho: 30,
        profundidad: 40,
        peso: 2
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Marco de fotos",
        precio: 4000,
        prom_valoraciones: 4,
        stock: 15,
        descripcion: "Marco de fotos de madera para tus recuerdos.",
        estado: "activo",
        image_url: "marco_de_fotos.webp",
        id_categoria:2,
        alto: 20,
        ancho: 15,
        profundidad: 2,
        peso: 1
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Reloj de pared",
        precio: 25000,
        prom_valoraciones: 4,
        stock: 5,
        descripcion: "Reloj de pared de madera, elegante y funcional.",
        estado: "activo",
        image_url: "reloj_de_pared.webp",
        id_categoria:2,
        alto: 30,
        ancho: 30,
        profundidad: 5,
        peso: 3
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Cajón organizador",
        precio: 20000,
        prom_valoraciones: 4,
        stock: 10,
        descripcion: "Cajón organizador de madera para mantener todo en orden.",
        estado: "activo",
        image_url: "cajon_organizador.webp",
        id_categoria:2,
        alto: 20,
        ancho: 30,
        profundidad: 40,
        peso: 4
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Banco de madera",
        precio: 80000,
        prom_valoraciones: 4,
        stock: 10,
        descripcion: "Banco de madera para jardín o patio.",
        estado: "activo",
        image_url: "banco_de_madera.webp",
        id_categoria:3,
        alto: 45,
        ancho: 120,
        profundidad: 40,
        peso: 18
      })),
      ProductosRepository.save(ProductosRepository.create({
        nombre: "Sofá de madera",
        precio: 250000,
        prom_valoraciones: 4,
        stock: 5,
        descripcion: "Sofá de madera con cojines, ideal para sala de estar.",
        estado: "activo",
        image_url: "sofa_de_madera.webp",
        id_categoria:3,
        alto: 90,
        ancho: 200,
        profundidad: 100,
        peso: 40
      })),
    ]);
    console.log(chalk.green("✅ Productos creados exitosamente."));
  } catch (error) {
    console.error(chalk.red("❌ Error al crear productos:", error));
  }
}


async function createValoraciones() {
  try {
    const ValoracionesRepository = AppDataSource.getRepository(Valoraciones);
    const count = await ValoracionesRepository.count();
    if (count > 0) {
      console.log(chalk.yellow("ℹ️  Valoraciones ya existen. Se omite creación."));
      return;
    }
    await Promise.all([
      ValoracionesRepository.save(ValoracionesRepository.create({
        id_usuario: 1,
        id_producto: 1,
        puntuacion: 5,
        descripcion: "Excelente producto",
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      ValoracionesRepository.save(ValoracionesRepository.create({
        id_usuario: 1,
        id_producto: 2,
        puntuacion: 4,
        descripcion: "Buen producto",
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      ValoracionesRepository.save(ValoracionesRepository.create({
        id_usuario: 1,
        id_producto: 3,
        puntuacion: 3,
        descripcion: "Producto regular",
        createdAt: new Date(),
        updatedAt: new Date()
      })),
    ]);
    console.log(chalk.green("✅ Valoraciones creadas exitosamente."));
  } catch (error) {
    console.error(chalk.red("❌ Error al crear Valoraciones:", error));
  }
}

export { 
  createUser, 
  createCategoria, 
  createProductos, 
  createValoraciones 
};
# NestJS con AWS Secrets Manager

NestJS con AWS Secrets Manager para construir una pequeña aplicación web y traernos unas variable desde Secret Manager con el SDK de JavaScript que nos proporciona AWS.

NestJS es un framework de Node.js que es versatil, flexible y ofrece varias ventajas al construir tus microservicios. AWS Secrets Manager permite resguardar datos sensibles de las aplicaciones desarrolladas y ser consumidos por medio del SDK que ofrece AWS para los diferentes lenguajes de programación.

## Pre-requisitos y consideraciones

El sistema operativo donde se desarrolló la explicación es macOS 10.15.4, estaremos usando algunos comandos de terminal, todos se ejecutaran con usuario simple. Fueron usadas las versiones de node 12.16 y npm 6.13, las cuales se da por supuesto que han sido instaladas previamente.

Recomiendo descargar e instalar nvm para unix, macOS o Windows Subsystem for Linux, permitirá tener varias versiones de node y cambiarte entre ellas muy rápido.

No explicaremos la creación o gestión de un Secret en la consola de AWS, se da por supuesto que ya tienen un Secret habilitado y las configuraciones de las credenciales o iam role para consumir el API de AWS.

## Iniciando el proyecto de NestJS

Ya deberíamos tener Node.js y npm o yarn instalado. Procedemos a instalar de forma global el cli de NestJS e iniciamos un proyecto con el nombre nestjs-secrets-manager.

```bash
$ npm i -g @nestjs/cli
$ nest new nestjs-secrets-manager
$ cd nestjs-secrets-manager
```

En el proyecto, debemos instalar el SDK de AWS para Node.js

```bash
$ npm i aws-sdk
```

NestJS tiene unos archivos iniciales en el directorio src, con el cual puedes hacer ver un "Hello World!" en http://localhost:3000 se debe iniciar el servicio


```bash
$ npm run start:dev
```

En el navegador web podrás ver el "Hello World!" del proyecto base.

## Creando el módulo y el servicio para usar el SDK de AWS

Vamos a generar un módulo y un proveedor de tipo servicio para hacer las llamadas de los Secrets, se llamará config


```bash
$ nest generate module config
$ nest generate service config
```

Usando las sentencias anteriores, no solamente se generaron el módulo y el servicio, se importó ConfigService dentro del módulo. Solo necesitamos exportar ConfigService cuando ConfigModule sea instanciado.

```Javascript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {}
```

Nos vamos a modificar sobre ConfigService para crear unos métodos y usar el SDK de AWS, haciendo el llamado al API de Secret Manager. Ya tenemos instalado en el proyecto el SDK, así que procedemos a importar y crear una variables que nos serán de utilidad a la hora de hacer la instancia de la clase.

```JavaScript
import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class ConfigService {
  private readonly region = '';
  private readonly secretName = '';
  private readAWSConfig = true;
  private readonly envConfig = {};
}
```

En el objeto envConfig guardarémos toda la información almacenada en el Secret.

Hacemos un método para obtener los valores del objeto envConfig cuando posea la información de Secret Manager.

```JavaScript
public async get(key: string): Promise<string> {
  if (this.readAWSConfig) {
    await this.upAWSSecrets();
  }
  return this.envConfig[key] ? this.envConfig[key] : "Doesn't exist";
}
```

El método anterior evalúa si debemos hacer la lectura de los Secrets con la variable readAWSConfig, si se debe realizar la lectura se llama al método upAWSSecrets.

```JavaScript
public async upAWSSecrets() {
  let error;

  let client = new AWS.SecretsManager({
    region: this.region,
  });

  const secrets = await client
    .getSecretValue({ SecretId: this.secretName })
    .promise()
    .catch(err => (error = err));

  if (error) {
    if (error.code === 'DecryptionFailureException')
      // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw error;
    else if (error.code === 'InternalServiceErrorException')
      // An error occurred on the server side.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw error;
    else if (error.code === 'InvalidParameterException')
    // You provided an invalid value for a parameter.
    // Deal with the exception here, and/or rethrow at your discretion.
      throw error;
    else if (error.code === 'InvalidRequestException')
      // You provided a parameter value that is not valid for the current state of the resource.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw error;
    else if (error.code === 'ResourceNotFoundException')
      // We can't find the resource that you asked for.
      // Deal with the exception here, and/or rethrow at your discretion.
      throw error;
  }

  const resultSecrets = JSON.parse(secrets.SecretString);

  for (let key in resultSecrets) {
    this.envConfig[key] = resultSecrets[key];
  }

  this.readAWSConfig = false;
}
```

El código anterior es tomado en una medida del ejemplo de uso del SDK y básicamente inicia la llamada al API de Secret Manager, evalua los posibles errores, en el for asignamos al objeto envConfig todas la variables y luego pasamos a false la lectura de los Secrets.

## Usando el módulo y service Config

El módulo Config ya fue importado al módulo principal App, entonces procedemos a crear un par de nuevos métodos en el controlador que usará ConfigService para llamar unas variables.

```JavaScript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService} from './config/config.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/firstPhrase')
  async getFirstPhrase(): Promise<string> {
    return await this.configService.get('FIRST_PHRASE');
  }

  @Get('/secondPhrase')
  async getSecondPhrase(): Promise<string> {
    return await this.configService.get('SECOND_PHRASE');
  }
}
```

Lo primero es hacer el import de ConfigSevice y hacer la instancia en el constructor de la clase AppController. Luego creamos los otros métodos que simplemente le asignamos una ruta con el tipo GET y hacemos los get en el configService para retornar los valores de las variables que fueron tomados de Secrets Manager.

Con lo anterior ya creamos una ruta en la aplicación para consultar esas 2 variables, pero en la compañia donde trabajo usamos Secrets Manager para la contraseñas de base de datos y diferentes variables de entorno en los microservicios que constantemente estamos desplegando.

## Conclusión

NestJS con AWS Secrets Manager nos puede facilitar la creación de una aplicación web, al mismo tiempo nos da la seguridad necesaria para desplegarlas, especialmente en microservicios y con facilidad para hacerlo rápido.

Post original en [ajdelgados.com](https://ajdelgados.com)
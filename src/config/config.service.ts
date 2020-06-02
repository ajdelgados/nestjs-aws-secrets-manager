import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class ConfigService {
    private readonly region = 'us-east-1';
    private readonly secretName = 'prod/auth/env';
    private readAWSConfig = true;
    private readonly envConfig = {};

    public async get(key: string): Promise<string> {
        if (this.readAWSConfig) {
            await this.upAWSSecrets();
        }
        return this.envConfig[key] ? this.envConfig[key] : "Doesn't exist";
    }

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
}

import * as mongoose from 'mongoose';
import { RepositoryBase } from './repository';
import { METADATA_KEY } from './constants';
import { DocumentMetadata } from './interfaces';
const { Mongoose } = mongoose;



export class MongooseConnection {
    public conn: mongoose.Connection;

    private repositories = new Map<string, RepositoryBase<any>>();

    private schemas = new Map<string, mongoose.Model<any>>();

    constructor(uri: string, options: mongoose.ConnectionOptions, listDocument: any[]) {
        let m = new Mongoose();
        this.conn = m.createConnection(uri, options);
        for (let document of listDocument) {
            let { collectionName, name, schema } = <DocumentMetadata>Reflect.getOwnMetadata(METADATA_KEY.document, document);
            let documentName = name.toLowerCase();
            let clazzSchema = this.conn.model<mongoose.Document>(name, schema, collectionName);
            this.schemas.set(documentName, clazzSchema);
        }
    }

    getRepository<T>(documentName: string)
    getRepository<T>(clazz: any) {
        if (typeof clazz === 'string') {
            return this.getRepositoryByName<T>(clazz);
        }

        let { collectionName, name, schema } = <DocumentMetadata>Reflect.getOwnMetadata(METADATA_KEY.document, clazz);
        let documentName = name.toLowerCase();
        if (this.repositories.has(documentName)) {
            return this.repositories.get(documentName);
        }

        let clazzSchema = this.conn.model<T & mongoose.Document>(name, schema, collectionName);
        let repository = new RepositoryBase<T>(clazzSchema);
        this.repositories.set(documentName, repository);
        return repository;
    }

    private getRepositoryByName<T>(documentName: string) {
        let name = documentName.toLowerCase();
        if (this.repositories.has(name)) {
            return this.repositories.get(name);
        } else {
            if (this.schemas.has(name)) {
                let repository = new RepositoryBase<T>(this.schemas.get(name));
                this.repositories.set(name, repository);
                return repository;
            }
            throw new Error(`Unknown repository ${name}`);
        }
    }
}
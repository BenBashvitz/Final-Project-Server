import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";

class BaseController<T> {
  model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async post(req: Request, res: Response) {
    const dataToInsert = req.body;

    try {
      const insertedData = await this.model.create(dataToInsert);
      res.status(201).json(insertedData);
    } catch (error) {
      console.error("An error occurred while creating data: ", error);
      res
        .status(500)
        .send("An internal error occurred while creating the data.");
    }
  }

  async getAll(req: Request, res: Response) {
    const filters = mongoose.sanitizeFilter(req.query);

    try {
      const data = await this.model.find(filters);

      return res.send(data);
    } catch (error) {
      console.error("An error occurred while getting all data: ", error);
      return res.status(500).send("An error occurred while getting all data");
    }
  }

  async getById(req: Request, res: Response) {
    const params = req.params;

    try {
      const data = await this.model.findById(params.id);

      if (data) {
        res.send(data);
      } else {
        res
          .status(404)
          .send(`The entity with the id ${params.id} was not found`);
      }
    } catch (error) {
      console.error(
        `An error occurred while getting data with the id: ${params.id} `,
        error,
      );
      res
        .status(500)
        .send(`An error occurred while getting data with the id: ${params.id}`);
    }
  }

  async put(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const updatedData = await this.model.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (updatedData) {
        return res.status(200).json(updatedData);
      } else {
        return res
          .status(404)
          .send(`The entity with the id ${id} was not found`);
      }
    } catch (error) {
      console.error(
        `An error occurred while updating data with the id: ${id}`,
        error,
      );
      return res
        .status(500)
        .send(`An error occurred while updating data with the id: ${id}`);
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const deletedData = await this.model.findOneAndDelete(
        { _id: id },
        { projection: { _id: 1 } },
      );

      if (deletedData) {
        res.status(200).json(deletedData);
      } else {
        res.status(404).send(`The entity with the id ${id} was not found`);
      }
    } catch (error) {
      console.error(
        `An error occurred while deleting data with the id: ${id}`,
        error,
      );
      res
        .status(500)
        .send(`An error occurred while deleting data with the id: ${id}`);
    }
  }
}

export default BaseController;

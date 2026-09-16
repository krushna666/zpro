import { Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import * as catalogService from './catalog.service';
import type {
  CreateBusInput,
  CreateBusLayoutInput,
  CreateBusTypeInput,
  CreateOperatorInput,
  CreateRouteInput,
  UpdateBusInput,
  UpdateOperatorInput,
} from './catalog.schemas';

// Operators

export async function createOperator(req: Request, res: Response): Promise<void> {
  const operator = await catalogService.createOperator(req.body as CreateOperatorInput);
  sendSuccess(res, operator, 'Operator created', 201);
}

export async function listOperators(_req: Request, res: Response): Promise<void> {
  const operators = await catalogService.listOperators();
  sendSuccess(res, operators, 'Operators');
}

export async function getOperator(req: Request, res: Response): Promise<void> {
  const operator = await catalogService.getOperator(req.params.operatorId as string);
  sendSuccess(res, operator, 'Operator');
}

export async function updateOperator(req: Request, res: Response): Promise<void> {
  const operator = await catalogService.updateOperator(
    req.params.operatorId as string,
    req.body as UpdateOperatorInput,
  );
  sendSuccess(res, operator, 'Operator updated');
}

// Bus types

export async function createBusType(req: Request, res: Response): Promise<void> {
  const busType = await catalogService.createBusType(req.body as CreateBusTypeInput);
  sendSuccess(res, busType, 'Bus type created', 201);
}

export async function listBusTypes(_req: Request, res: Response): Promise<void> {
  const busTypes = await catalogService.listBusTypes();
  sendSuccess(res, busTypes, 'Bus types');
}

// Buses

export async function createBus(req: Request, res: Response): Promise<void> {
  const bus = await catalogService.createBus(req.params.operatorId as string, req.body as CreateBusInput);
  sendSuccess(res, bus, 'Bus created', 201);
}

export async function listBusesForOperator(req: Request, res: Response): Promise<void> {
  const buses = await catalogService.listBusesForOperator(req.params.operatorId as string);
  sendSuccess(res, buses, 'Buses');
}

export async function getBus(req: Request, res: Response): Promise<void> {
  const bus = await catalogService.getBus(req.params.busId as string);
  sendSuccess(res, bus, 'Bus');
}

export async function updateBus(req: Request, res: Response): Promise<void> {
  const bus = await catalogService.updateBus(req.params.busId as string, req.body as UpdateBusInput);
  sendSuccess(res, bus, 'Bus updated');
}

// Bus layouts

export async function createBusLayout(req: Request, res: Response): Promise<void> {
  const layout = await catalogService.createBusLayout(
    req.params.busId as string,
    req.body as CreateBusLayoutInput,
  );
  sendSuccess(res, layout, 'Bus layout created', 201);
}

export async function listBusLayouts(req: Request, res: Response): Promise<void> {
  const layouts = await catalogService.listBusLayouts(req.params.busId as string);
  sendSuccess(res, layouts, 'Bus layouts');
}

// Routes

export async function createRoute(req: Request, res: Response): Promise<void> {
  const route = await catalogService.createRoute(req.body as CreateRouteInput);
  sendSuccess(res, route, 'Route created', 201);
}

export async function listRoutes(req: Request, res: Response): Promise<void> {
  const operatorId = typeof req.query.operatorId === 'string' ? req.query.operatorId : undefined;
  const routes = await catalogService.listRoutes(operatorId);
  sendSuccess(res, routes, 'Routes');
}

export async function getRoute(req: Request, res: Response): Promise<void> {
  const route = await catalogService.getRoute(req.params.routeId as string);
  sendSuccess(res, route, 'Route');
}

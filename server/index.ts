import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const app = express();
app.use(cors());
app.use(express.json());


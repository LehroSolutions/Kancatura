# Kancatura Architecture Decision Records

This folder tracks architecture decisions for the Kancatura business plan application.

## Accepted ADRs

- [ADR 0001: React 19, shadcn-style UI, and Convex for Kancatura](adr/0001-kancatura-react19-shadcn-convex.md)

## Current Decision Summary

Kancatura is implemented as a React 19 + Vite workbench with local shadcn-style primitives and a Convex-first backend scaffold. The frontend remains usable in demo mode until the user runs Convex setup/codegen against a selected deployment.

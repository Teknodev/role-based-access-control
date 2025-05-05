import * as Bucket from "@spica-devkit/bucket"
import * as Identity from "@spica-devkit/identity";

const API_SECRET_KEY = process.env.API_SECRET_KEY;

export function useBucket(initializeParams = { apikey: API_SECRET_KEY }) {
	Bucket.initialize({ ...initializeParams });
	return Bucket;
}

export function useIdentity(initializeParams = { apikey: API_SECRET_KEY }) {
	Identity.initialize({ ...initializeParams });
	return Identity;
}

export function decodeToken(req) {
	const token = req.headers.get("authorization")
	const Identity = useIdentity();
	return Identity.verifyToken(token).catch(() => { });
}

export const BUCKET = {
	ROLE: "6810b8812e6854005053aace",
	ROLE_ASSIGMENT: "6810e7572e6854005053ae91",
	ROLE_ACTION: "6810b41c2e6854005053aa54",
	ORGANIZATION: "6810b3292e6854005053aa36",
	TEAM: "6810b3e32e6854005053aa45",
	RESOURCE: "6810b3f12e6854005053aa4a",
	AUDIT_LOG: "6810b4382e6854005053aa59",
	INVITATION: "6810b3fd2e6854005053aa4f",
}
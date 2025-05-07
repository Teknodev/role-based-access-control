import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";
import * as Organization from "../../6810bd002e6854005053ab25/.build/index.mjs";
import * as Team from "../../68122cb52e6854005053c2e9/.build/index.mjs";
import * as Resource from "../../68186b042e6854005053e593/.build/index.mjs";

const ACCESS_STATUS = {
	GRANTED: "granted",
	FORBIDDEN: "forbidden",
}

export function check(action, handler) {
	return async function (req, res) {
		try {
			const scopeItemId = req.params.get("id");

			const decodedToken = await Api.decodeToken(req);
			const user = decodedToken?.attributes?.user;
			const hasAccess = await isHasAccess(action, decodedToken, scopeItemId);
			if (!hasAccess) {
				insertLog(action, ACCESS_STATUS.FORBIDDEN, user);
				return res.status(403).send({ message: "Forbidden" })
			};

			insertLog(action, ACCESS_STATUS.GRANTED, user, scopeItemId);
			return handler(req, res);
		} catch (err) {
			console.error("Access check failed:", err);
			return res.status(500).send({ message: "Internal Server Error" });
		}
	};
}

async function isHasAccess(action, decodedToken, scopeItemId) {
	const roleAssignment = decodedToken?.attributes?.role_assignment;
	if (!roleAssignment) return false;

	const { role_actions: roleActions } = await getRoleAssignment(roleAssignment);
	if (!roleActions?.length) return false;

	if (scopeItemId) {
		const resource = await getResourceByItemId(scopeItemId);
		if (resource) scopeItemId = resource?._id
	}

	// 1. Check direct scope-level match
	const scopeMatched = roleActions
		.filter(({ organization, team, resource }) => [organization, team, resource].includes(scopeItemId))
		.some(roleAction => roleAction.actions?.includes(action));
	if (scopeMatched) return true;

	// 2. Check organization-level match
	if (resource?.organization) {
		const orgMatched = roleActions.some(({ organization }) => organization === resource.organization);
		if (orgMatched) return true;
	}

	// 3. Check team-level match
	if (Array.isArray(resource?.teams)) {
		const teamMatched = roleActions.some(({ team }) => resource.teams.includes(team));
		if (teamMatched) return true;
	}

	return false;
}

function getRoleAssignment(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.get(Api.BUCKET.ROLE_ASSIGNMENT, id, {
		queryParams: {
			relation: ["role_actions"]
		}
	});
}

export function createRoleAssignment(title = "") {
	const Bucket = Api.useBucket();
	return Bucket.data.insert(Api.BUCKET.ROLE_ASSIGNMENT, { title });
}

function getResourceByItemId(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.getAll(Api.BUCKET.RESOURCE, {
		queryParams: { filter: { item: id } }
	}).then(r => r[0])
}

async function insertLog(action, status, user, scopeItemId) {
	try {
		const Bucket = Api.useBucket();
		const scope = await getScopeKey(scopeItemId);
		const logData = { action, user, status, created_at: new Date() }
		if (scope) logData[scope] = scopeItemId;

		return Bucket.data.insert(Api.BUCKET.AUDIT_LOG, logData)
	} catch (err) {
		console.error("Insert Log:", err);
	}
}

async function getScopeKey(id) {
	if (!id) return;

	const checks = [
		{ fn: Organization.getOrganization, type: "organization" },
		{ fn: Team.getTeam, type: "team" },
		{ fn: Resource.getResource, type: "resource" },
	];

	for (const { fn, type } of checks) {
		const result = await fn(id);
		if (result) return type;
	}
}
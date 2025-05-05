import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";

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

			insertLog(action, ACCESS_STATUS.FORBIDDEN, user);
			return handler(req, res);
		} catch (err) {
			console.error("Access check failed:", err);
			return res.status(500).send({ message: "Internal Server Error" });
		}
	};
}

async function isHasAccess(action, decodedToken, scopeItemId) {
	const roleAssigment = decodedToken?.attributes?.role_assigment;
	if (!roleAssigment) return false;

	const { role_actions: roleActions } = await getRoleAssigment(roleAssigment);
	if (!roleActions?.length) return false;

	const resource = await getResourceByItemId(scopeItemId);
	if (resource) scopeItemId = resource?._id

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

function getRoleAssigment(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.get(Api.BUCKET.ROLE_ASSIGMENT, id, {
		queryParams: {
			relation: ["role_actions"]
		}
	});
}

function getResourceByItemId(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.getAll(Api.BUCKET.RESOURCE, {
		queryParams: { filter: { item: id } }
	}).then(r => r[0])
}

function insertLog(action, status, user) {
	const Bucket = Api.useBucket();
	return Bucket.data.insert(Api.BUCKET.AUDIT_LOG,
		{ action, user, status, created_at: new Date() }
	).catch((err) => console.error(err))
}
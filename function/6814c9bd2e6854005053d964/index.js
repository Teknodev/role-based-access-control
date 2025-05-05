
import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";

export async function initializeDefaultData(req, res) {
	const { owner } = req.body;
	if (!owner) {
		return res.status(400).send({ message: "Missing required parameter" });
	}

	const roles = ["owner", "admin", "member"];
	const scopes = ["organization", "team"];

	const ids = getDefaultIds();
	const rolePromises = createRolePromises(ids, roles, scopes);
	const orgAndTeamPromises = createOrganizationAndTeamPromises(ids, owner);
	const roleActionPromises = createRoleActionPromises(ids);

	const allPromises = [
		...rolePromises,
		...orgAndTeamPromises,
		...roleActionPromises
	];

	try {
		await Promise.all(allPromises);
		return res.status(200).send({ message: "Success" });
	} catch (error) {
		console.error(error);
		return res.status(500).send({ message: "Error initializing data" });
	}
}

const getDefaultIds = () => ({
	organization: "681204442e6854005053baa0",
	team: "681204442e6854005053baa1",
	roles: {
		owner: {
			organization: "681204442e6854005053baa2",
			team: "681204442e6854005053baa3"
		},
		admin: {
			organization: "681204442e6854005053baa4",
			team: "681204442e6854005053baa5"
		},
		member: {
			organization: "681204442e6854005053baa6",
			team: "681204442e6854005053baa7"
		},
	}
})

function createRolePromises(ids, roles, scopes) {
	const Bucket = Api.useBucket();
	const promises = [];
	scopes.forEach(scope => {
		roles.forEach(role => {
			promises.push(Bucket.data.insert(Api.BUCKET.ROLE, {
				_id: ids.roles[role][scope],
				name: role,
				scope: scope,
			}));
		});
	});
	return promises;
}

function createOrganizationAndTeamPromises(ids, ownerId) {
	const Bucket = Api.useBucket();
	return [
		Bucket.data.insert(Api.BUCKET.ORGANIZATION, {
			_id: ids.organization,
			name: "Organization",
			description: "Description of the organization",
			owner: ownerId,
			members: [ownerId]
		}),
		Bucket.data.insert(Api.BUCKET.TEAM, {
			_id: ids.team,
			name: "Team",
			description: "Description of the team",
			organization: ids.organization,
			members: [ownerId]
		})
	];
}

function createRoleActionPromises(ids) {
	const roleActions = [
		{
			title: "organization owner",
			role: ids.roles.owner.organization,
			organization: ids.organization,
			actions: [
				"organization:create",
				"organization:delete",
				"organization:rename",
				"organization:invite",
				"organization:revoke",
				"organization:member:delete",
				"team:create",
				"team:delete",
				"team:rename",
				"team:invite",
				"team:revoke",
				"team:member:delete"
			]
		},
		{
			title: "organization admin",
			role: ids.roles.admin.organization,
			organization: ids.organization,
			actions: [
				"organization:invite",
				"organization:revoke",
				"organization:member:delete",
				"team:create",
				"team:rename",
				"team:invite",
				"team:revoke",
				"team:member:delete"
			]
		},
		{
			title: "organization member",
			role: ids.roles.member.organization,
			organization: ids.organization,
			actions: []
		},
		{
			title: "team owner",
			role: ids.roles.owner.team,
			team: ids.team,
			actions: [
				"team:create",
				"team:delete",
				"team:rename",
				"team:invite",
				"team:revoke",
				"team:member:delete"
			]
		},
		{
			title: "team admin",
			role: ids.roles.admin.team,
			team: ids.team,
			actions: [
				"team:invite",
				"team:revoke",
				"team:member:delete"
			]
		},
		{
			title: "team member",
			role: ids.roles.member.team,
			team: ids.team,
			actions: []
		}
	];

	const Bucket = Api.useBucket();
	return roleActions.map(el =>
		Bucket.data.insert(Api.BUCKET.ROLE_ACTION, el)
	);
}
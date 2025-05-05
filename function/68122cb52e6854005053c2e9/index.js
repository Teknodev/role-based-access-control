import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";
import * as AccessManager from "../../6810bc722e6854005053ab0d/.build";
import * as Invitation from "../../68123c2b2e6854005053c596/.build";

export const name = "Team";

export async function create(req, res) {
	return AccessManager.check("team:create", async (req, res) => {
		const { name, description, organization } = req.body;

		const Bucket = Api.useBucket();
		return Bucket.data.insert(Api.BUCKET.TEAM, { name, description, organization });
	})(req, res);
}

export async function _delete(req, res) {
	return AccessManager.check("team:delete", async (req, res) => {
		const id = req.params.get("id");

		const Bucket = Api.useBucket();
		return Bucket.data.remove(Api.BUCKET.TEAM, id);
	})(req, res);
}

export async function rename(req, res) {
	return AccessManager.check("team:rename", async (req, res) => {
		const { name } = req.body;
		const id = req.params.get("id");

		const Bucket = Api.useBucket();
		return Bucket.data.patch(Api.BUCKET.TEAM, id, { name });
	})(req, res);
}

export async function invite(req, res) {
	return AccessManager.check("team:invite", async (req, res) => {
		return Invitation.invite(req, res);
	})(req, res);
}

export async function revoke(req, res) {
	return AccessManager.check("team:revoke", async (req, res) => {
		return Invitation.revoke(req, res);
	})(req, res);
}

export async function deleteMember(req, res) {
	return AccessManager.check("team:member:delete", async (req, res) => {
		const id = req.params.get("id");
		const memberId = req.params.get("memberId");

		const team = await getTeam(id);
		const members = team.members || [];

		const filteredMembers = members.filter(member => member !== memberId)

		const Bucket = Api.useBucket();
		return Bucket.data.patch(Api.BUCKET.TEAM, id, { members: filteredMembers });
	})(req, res);
}

export function getTeam(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.get(Api.BUCKET.TEAM, id);
}

export function patchTeam(id, data) {
	const Bucket = Api.useBucket();
	return Bucket.data.patch(Api.BUCKET.TEAM, id, data);
}
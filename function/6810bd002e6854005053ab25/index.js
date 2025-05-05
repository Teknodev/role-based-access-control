import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";
import * as AccessManager from "../../6810bc722e6854005053ab0d/.build";
import * as Invitation from "../../68123c2b2e6854005053c596/.build";

export const name = "Organization";

export async function create(req, res) {
	return AccessManager.check("organization:create", async (req, res) => {
		const { name, description } = req.body;
		const { attributes } = await Api.decodeToken(req);

		const Bucket = Api.useBucket();
		return Bucket.data.insert(Api.BUCKET.ORGANIZATION, { name, description, owner: attributes?.user });
	})(req, res);
}

export async function _delete(req, res) {
	return AccessManager.check("organization:delete", async (req, res) => {
		const id = req.params.get("id");

		const Bucket = Api.useBucket();
		return Bucket.data.remove(Api.BUCKET.ORGANIZATION, id);
	})(req, res);
}

export async function rename(req, res) {
	return AccessManager.check("organization:rename", async (req, res) => {
		const { name } = req.body;
		const id = req.params.get("id");

		const Bucket = Api.useBucket();
		return Bucket.data.patch(Api.BUCKET.ORGANIZATION, id, { name });
	})(req, res);
}

export async function invite(req, res) {
	return AccessManager.check("organization:invite", async (req, res) => {
		return Invitation.invite(req, res);
	})(req, res);
}

export async function revoke(req, res) {
	return AccessManager.check("organization:revoke", async (req, res) => {
		return Invitation.revoke(req, res);
	})(req, res);
}

export async function deleteMember(req, res) {
	return AccessManager.check("organization:member:delete", async (req, res) => {
		const id = req.params.get("id");
		const memberId = req.params.get("memberId");

		const organization = await getOrganization(id);
		const members = organization.members || [];

		const filteredMembers = members.filter(member => member !== memberId)

		const Bucket = Api.useBucket();
		return Bucket.data.patch(Api.BUCKET.ORGANIZATION, id, { members: filteredMembers });
	})(req, res);
}

export function getOrganization(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.get(Api.BUCKET.ORGANIZATION, id);
}

export function patchOrganization(id, data) {
	const Bucket = Api.useBucket();
	return Bucket.data.patch(Api.BUCKET.ORGANIZATION, id, data);
}
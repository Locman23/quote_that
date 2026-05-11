export type GroupRole = 'admin' | 'member';

export type QuoteRecord = {
	id: string;
	group_id: string;
	created_by: string;
	quoted_person_name: string;
	content: string;
	context: string | null;
	created_at: string;
	updated_at: string;
};
